import { Controller, Get, Patch, Post, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return { data: await this.adminService.getStats() }
  }

  @Get('artisans')
  async listArtisans(@Query() query: any) {
    return { data: await this.adminService.listArtisans(query) }
  }

  @Patch('artisans/:id/approval')
  async setArtisanApproval(@Param('id') id: string, @Body('approvalStatus') approvalStatus: string) {
    return { data: await this.adminService.setArtisanApproval(id, approvalStatus) }
  }

  @Patch('artisans/:id/verification')
  async setArtisanVerification(@Param('id') id: string, @Body('verificationStatus') verificationStatus: string) {
    return { data: await this.adminService.setArtisanVerification(id, verificationStatus) }
  }

  @Get('users')
  async listUsers(@Query() query: any) {
    return { data: await this.adminService.listUsers(query) }
  }

  @Patch('users/:id/status')
  async setUserStatus(@Param('id') id: string, @Body('status') status: string) {
    return { data: await this.adminService.setUserStatus(id, status) }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    return { data: await this.adminService.deleteUser(id, req.user.id) }
  }

  @Get('reviews')
  async listReviews(@Query() query: any) {
    return { data: await this.adminService.listReviews(query) }
  }

  @Patch('reviews/:id/status')
  async setReviewStatus(@Param('id') id: string, @Body('status') status: string) {
    return { data: await this.adminService.setReviewStatus(id, status) }
  }

  @Get('bookings')
  async listBookings(@Query() query: any) {
    return { data: await this.adminService.listBookings(query) }
  }

  @Get('payments')
  async listPayments(@Query() query: any) {
    return { data: await this.adminService.listPayments(query) }
  }

  @Get('disputes')
  async listDisputes(@Query() query: any) {
    return { data: await this.adminService.listDisputes(query) }
  }

  @Post('disputes/:id/resolve')
  async resolveDispute(@Param('id') id: string, @Body() body: any) {
    return { data: await this.adminService.resolveDispute(id, body.status, body.resolution) }
  }

  @Get('support-messages')
  async listSupportMessages(@Query() query: any) {
    return { data: await this.adminService.listSupportMessages(query) }
  }

  @Patch('support-messages/:id/status')
  async setSupportMessageStatus(@Param('id') id: string, @Body('status') status: string) {
    return { data: await this.adminService.setSupportMessageStatus(id, status) }
  }
}
