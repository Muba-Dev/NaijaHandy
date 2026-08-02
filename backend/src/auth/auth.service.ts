import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 30

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  private async issueTokens(user: { id: string; role: string }) {
    const accessToken = this.jwtService.sign({ id: user.id, role: user.role }, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refreshToken = this.jwtService.sign({ id: user.id, role: user.role }, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` })
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

    const tokens = await this.issueTokens({ id: user.id, role: user.role })
    return { ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.issueTokens({ id: user.id, role: user.role })
    return { ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  }

  async refresh(refreshToken: string) {
    const existing = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!existing) throw new UnauthorizedException('Invalid refresh token')
    if (existing.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { token: refreshToken } })
      throw new UnauthorizedException('Refresh token expired')
    }

    const payload = this.jwtService.verify<{ id: string; role: string }>(refreshToken, {
      secret: process.env.JWT_SECRET || 'artisanng-dev-secret-key-change-in-production',
    })

    await this.prisma.refreshToken.delete({ where: { token: refreshToken } })
    return this.issueTokens({ id: payload.id, role: payload.role })
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
}
