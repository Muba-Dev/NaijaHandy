import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import * as bcrypt from 'bcrypt'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { JWT_SECRET } from '../config'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 30
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const OTP_RESEND_MS = 60 * 1000 // resend cooldown
const OTP_MAX_ATTEMPTS = 5
const DEFAULT_AVATAR = '/avatars/default.svg'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private async issueTokens(user: { id: string; role: string }) {
    const accessToken = this.jwtService.sign({ id: user.id, role: user.role }, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refreshToken = this.jwtService.sign(
      { id: user.id, role: user.role, nonce: randomBytes(16).toString('hex') },
      { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` },
    )
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    return { accessToken, refreshToken }
  }

  async register(data: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new BadRequestException('Email already in use')

    const hashedPassword = await bcrypt.hash(data.password, 12)
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        password: hashedPassword,
        role: data.role,
        emailVerified: false,
        avatar: DEFAULT_AVATAR,
        ...(data.role === 'ARTISAN' && data.profession ? {
          artisanProfile: {
            create: {
              profession: data.profession,
              category: data.category || data.profession,
              bio: '',
              hourlyRate: 0,
            },
          },
        } : {}),
      },
    })

    if (data.role === 'ARTISAN') {
      const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } })
      for (const admin of admins) {
        await this.emailService.sendNewArtisanPendingEmail({
          to: admin.email,
          artisanName: data.name,
          profession: data.profession || data.category || 'Artisan',
        })
      }
    }

    // The account exists but cannot log in until the email is verified by OTP.
    // No tokens are issued here — first login happens via verify-email/confirm.
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || DEFAULT_AVATAR },
      verificationRequired: true,
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedException('Email or password is incorrect')
    if (user.status === 'SUSPENDED') throw new UnauthorizedException('Account suspended')
    if (user.status === 'DELETED') throw new UnauthorizedException('This account has been deleted')
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in')
    }

    if (!user.password) {
      throw new UnauthorizedException('This account uses Google sign-in. Please log in with Google.')
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedException('Email or password is incorrect')

    const tokens = await this.issueTokens({ id: user.id, role: user.role })
    return { ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || DEFAULT_AVATAR } }
  }

  // ── Email verification (signup OTP) ─────────────────────────────────────────

  private static hashOtp(code: string): string {
    return createHash('sha256').update(code).digest('hex')
  }

  private static generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000))
  }

  // OTP emails are gated on EMAIL_ENABLED like every other email. When it is
  // not set (local dev, CI), return the code in the response so the flow stays
  // usable — the same mock pattern PAYSTACK_MOCK uses.
  private emailVerificationDevMock(): boolean {
    return process.env.EMAIL_ENABLED !== 'true'
  }

  private async sendVerificationCode(userId: string, email: string): Promise<string> {
    const code = AuthService.generateOtp()
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        codeHash: AuthService.hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    })
    await this.emailService.sendVerificationEmail(email, code)
    return code
  }

  async requestEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new BadRequestException('No account found with that email')
    if (user.emailVerified) throw new BadRequestException('This email is already verified')

    const last = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, used: false },
      orderBy: { createdAt: 'desc' },
    })
    if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_MS) {
      throw new BadRequestException('A verification code was just sent. Please wait a minute before requesting another.')
    }

    await this.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, used: false } })
    const code = await this.sendVerificationCode(user.id, user.email)

    return { success: true, ...(this.emailVerificationDevMock() ? { devCode: code } : {}) }
  }

  async confirmEmailVerification(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new BadRequestException('No account found with that email')
    if (user.emailVerified) throw new BadRequestException('This email is already verified')

    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, used: false },
      orderBy: { createdAt: 'desc' },
    })
    if (!record) throw new BadRequestException('No verification code found. Please request a new one.')
    if (record.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { used: true } })
      throw new BadRequestException('This verification code has expired. Please request a new one.')
    }

    const matches = timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(AuthService.hashOtp(code)))
    if (!matches) {
      const attempts = record.attempts + 1
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { used: true, attempts } })
        throw new BadRequestException('Too many incorrect attempts. Please request a new code.')
      }
      await this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { attempts } })
      throw new BadRequestException('Incorrect verification code')
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { used: true } }),
      this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    ])

    const tokens = await this.issueTokens({ id: user.id, role: user.role })
    return { ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || DEFAULT_AVATAR } }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    // Always succeed (even for unknown emails) to avoid leaking which accounts exist.
    if (!user) return { success: true }

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, used: false } })

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await this.prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } })

    const base = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetUrl = `${base}/reset-password?token=${token}`
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl)
    return { success: true }
  }

  async resetPassword(token: string, password: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, used: true },
    })
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset link. Please request a new one.')
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({ where: { userId: record.userId }, data: { used: true } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } }),
    ])
    return { success: true }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, password: true } })
    if (!user) throw new UnauthorizedException('Account not found')
    if (!user.password) {
      throw new BadRequestException('This account uses Google sign-in and has no password.')
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new UnauthorizedException('Current password is incorrect')

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } }),
    ])
    return { success: true }
  }

  getGoogleAuthUrl(state: string): string | null {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    if (!clientId || !redirectUri) return null

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
      access_type: 'online',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async googleCallback(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google sign-in is not configured on the server')
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google authentication failed')
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = (await profileRes.json()) as {
      sub: string
      email: string
      email_verified?: boolean
      name?: string
      picture?: string
    }
    if (!profile.email) throw new UnauthorizedException('Google did not return an email address')

    const name = profile.name || profile.email.split('@')[0]
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } })
    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || profile.sub,
          avatar: user.avatar || profile.picture || DEFAULT_AVATAR,
          emailVerified: true,
        },
      })
    } else {
      user = await this.prisma.user.create({
        data: {
          name,
          email: profile.email,
          googleId: profile.sub,
          avatar: profile.picture || DEFAULT_AVATAR,
          role: 'CUSTOMER',
          emailVerified: true,
        },
      })
    }

    const tokens = await this.issueTokens({ id: user.id, role: user.role })
    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || DEFAULT_AVATAR },
    }
  }

  async refresh(refreshToken: string) {
    const existing = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!existing) throw new UnauthorizedException('Invalid refresh token')
    if (existing.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { token: refreshToken } })
      throw new UnauthorizedException('Refresh token expired')
    }

    const payload = this.jwtService.verify<{ id: string; role: string }>(refreshToken, {
      secret: JWT_SECRET,
    })

    const user = await this.prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, status: true } })
    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
      throw new UnauthorizedException('Account suspended')
    }

    await this.prisma.refreshToken.delete({ where: { token: refreshToken } })
    return this.issueTokens({ id: payload.id, role: payload.role })
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
}
