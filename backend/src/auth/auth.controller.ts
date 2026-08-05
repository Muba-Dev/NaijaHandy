import { Controller, Post, Body, BadRequestException, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { z } from 'zod'

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
}
