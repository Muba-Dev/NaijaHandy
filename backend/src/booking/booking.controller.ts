import { Controller, Post, Get, Patch, Body, Query, Param, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { BookingService } from './booking.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { z } from 'zod'

const createSchema = z.object({
  artisanId: z.string(),
  date: z.string(),
  time: z.string(),
  description: z.string().min(10),
  amount: z.number().int().positive(),
})

const updateSchema = z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']) })

const disputeSchema = z.object({ reason: z.string().min(10) })

@Controller('api/bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    try {
      const data = createSchema.parse(body)
      return { data: await this.bookingService.create(req.user.id, data) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    return { data: await this.bookingService.findAll(req.user.id, req.user.role, query) }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    try {
      const { status } = updateSchema.parse(body)
      return { data: await this.bookingService.updateStatus(req.user.id, req.user.role, id, status) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/dispute')
  async raiseDispute(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    try {
      const { reason } = disputeSchema.parse(body)
      return { data: await this.bookingService.raiseDispute(req.user.id, id, reason) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }
}
