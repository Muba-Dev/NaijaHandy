import { Controller, Get, Patch, Post, Req, Body, UseGuards, BadRequestException } from '@nestjs/common'
import { UserService } from './user.service'
import { UploadService } from '../upload/upload.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

const updateMeSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().max(30).optional().nullable(),
    city: z.string().max(80).optional().nullable(),
    avatar: z.string().max(2000).optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    bankName: z.string().max(80).optional().nullable(),
    bankAccountNumber: z.string().max(30).optional().nullable(),
    bankAccountName: z.string().max(120).optional().nullable(),
  })
  .strict()

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService, private uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMe(@Req() req: any) {
    return { data: await this.userService.findMe(req.user.id) }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    try {
      const data = updateMeSchema.parse(body)
      return { data: await this.userService.updateMe(req.user.id, data) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  async updateAvatar(@Req() req: any, @Body() body: { image?: string }) {
    const url = await this.uploadService.uploadAvatar(body.image || '')
    return { data: await this.userService.updateMe(req.user.id, { avatar: url }) }
  }
}
