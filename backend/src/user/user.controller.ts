import { Controller, Get, Patch, Post, Req, Body, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { UploadService } from '../upload/upload.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

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
    return { data: await this.userService.updateMe(req.user.id, body) }
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  async updateAvatar(@Req() req: any, @Body() body: { image?: string }) {
    const url = await this.uploadService.uploadAvatar(body.image || '')
    return { data: await this.userService.updateMe(req.user.id, { avatar: url }) }
  }
}
