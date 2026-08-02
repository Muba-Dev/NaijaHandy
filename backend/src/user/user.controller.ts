import { Controller, Get, Patch, Req, Body, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

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
}
