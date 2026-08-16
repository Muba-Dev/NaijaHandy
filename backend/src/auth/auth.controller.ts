import { Controller, Post, Body, Get, Query, Res, Req, UseGuards, BadRequestException, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common'
import type { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['CUSTOMER', 'ARTISAN']),
  profession: z.string().optional(),
  category: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

const verifyEmailRequestSchema = z.object({
  email: z.string().email(),
})

const verifyEmailConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
})

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    try {
      const data = registerSchema.parse(body)
      return this.authService.register(data)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof Error) throw new BadRequestException(err.message)
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    try {
      const data = loginSchema.parse(body)
      return this.authService.login(data.email, data.password)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof UnauthorizedException) throw err
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    try {
      const data = refreshSchema.parse(body)
      return this.authService.refresh(data.refreshToken)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof UnauthorizedException) throw err
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: any) {
    try {
      const data = refreshSchema.parse(body)
      await this.authService.logout(data.refreshToken)
      return { success: true }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: any) {
    try {
      const data = forgotPasswordSchema.parse(body)
      return await this.authService.forgotPassword(data.email)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof Error) throw new BadRequestException(err.message)
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    try {
      const data = resetPasswordSchema.parse(body)
      return await this.authService.resetPassword(data.token, data.password)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof BadRequestException) throw err
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: Request, @Body() body: any) {
    try {
      const data = changePasswordSchema.parse(body)
      return await this.authService.changePassword((req.user as { id: string }).id, data.currentPassword, data.newPassword)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) throw err
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('verify-email/request')
  @HttpCode(HttpStatus.OK)
  async requestEmailVerification(@Body() body: any) {
    try {
      const data = verifyEmailRequestSchema.parse(body)
      return await this.authService.requestEmailVerification(data.email)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof BadRequestException) throw err
      throw new BadRequestException('Invalid request')
    }
  }

  @Post('verify-email/confirm')
  async confirmEmailVerification(@Body() body: any) {
    try {
      const data = verifyEmailConfirmSchema.parse(body)
      return await this.authService.confirmEmailVerification(data.email, data.code)
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      if (err instanceof BadRequestException) throw err
      throw new BadRequestException('Invalid request')
    }
  }

  @Get('google')
  async googleLogin(@Res() res: Response) {
    const state = randomBytes(16).toString('hex')
    const url = this.authService.getGoogleAuthUrl(state)
    if (!url) {
      throw new BadRequestException('Google sign-in is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI to the backend .env')
    }
    return res.redirect(url)
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.googleCallback(code)
      const base = process.env.FRONTEND_URL || 'http://localhost:3000'
      const url = `${base}/oauth-callback?accessToken=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}&role=${encodeURIComponent(result.user.role)}`
      return res.redirect(url)
    } catch (err) {
      const base = process.env.FRONTEND_URL || 'http://localhost:3000'
      const message = encodeURIComponent(
        err instanceof Error ? err.message : 'Google sign-in failed',
      )
      return res.redirect(`${base}/oauth-callback?error=${message}`)
    }
  }
}
