import { Controller, Get, Patch, Post, Delete, Param, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { z } from 'zod'

const approvalSchema = z.object({
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
})
const verificationSchema = z.object({
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']),
})
const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
})
const reviewStatusSchema = z.object({
  status: z.enum(['APPROVED', 'HIDDEN']),
})
const resolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolution: z.string().max(2000).optional(),
})
const supportStatusSchema = z.object({
  status: z.enum(['OPEN', 'REPLIED', 'CLOSED']),
})

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
  async setArtisanApproval(@Param('id') id: string, @Body() body: any) {
    try {
      const { approvalStatus } = approvalSchema.parse(body)
      return { data: await this.adminService.setArtisanApproval(id, approvalStatus) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @Patch('artisans/:id/verification')
  async setArtisanVerification(@Param('id') id: string, @Body() body: any) {
    try {
      const { verificationStatus } = verificationSchema.parse(body)
      return { data: await this.adminService.setArtisanVerification(id, verificationStatus) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @Get('users')
  async listUsers(@Query() query: any) {
    return { data: await this.adminService.listUsers(query) }
  }

  @Patch('users/:id/status')
  async setUserStatus(@Param('id') id: string, @Body() body: any) {
    try {
      const { status } = userStatusSchema.parse(body)
      return { data: await this.adminService.setUserStatus(id, status) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
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
  async setReviewStatus(@Param('id') id: string, @Body() body: any) {
    try {
      const { status } = reviewStatusSchema.parse(body)
      return { data: await this.adminService.setReviewStatus(id, status) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
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
    try {
      const { status, resolution } = resolveDisputeSchema.parse(body)
      return { data: await this.adminService.resolveDispute(id, status, resolution) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @Get('support-messages')
  async listSupportMessages(@Query() query: any) {
    return { data: await this.adminService.listSupportMessages(query) }
  }

  @Patch('support-messages/:id/status')
  async setSupportMessageStatus(@Param('id') id: string, @Body() body: any) {
    try {
      const { status } = supportStatusSchema.parse(body)
      return { data: await this.adminService.setSupportMessageStatus(id, status) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }
}
