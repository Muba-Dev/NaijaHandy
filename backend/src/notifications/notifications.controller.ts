import { Controller, Get, Patch, Post, Param, Req, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: any) {
    return { data: await this.notificationsService.findAll(req.user.id) }
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    return { data: { count: await this.notificationsService.unreadCount(req.user.id) } }
  }

  @Patch(':id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    return { data: await this.notificationsService.markRead(req.user.id, id) }
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    return { data: await this.notificationsService.markAllRead(req.user.id) }
  }
}
