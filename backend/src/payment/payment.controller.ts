import { Controller, Post, Get, Param, Body, Req, UseGuards, BadRequestException, HttpCode } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { z } from 'zod'

const initSchema = z.object({ bookingId: z.string() })

@Controller('api/payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  async initialize(@Req() req: any, @Body() body: any) {
    try {
      const { bookingId } = initSchema.parse(body)
      return { data: await this.paymentService.initialize(req.user.id, bookingId) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:reference')
  async verify(@Req() req: any, @Param('reference') reference: string) {
    return { data: await this.paymentService.verify(reference, req.user.id, req.user.role) }
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: any) {
    const signature = req.headers['x-paystack-signature'] as string | undefined
    const rawBody: Buffer = req.rawBody || Buffer.from(JSON.stringify(req.body || {}))
    return { data: await this.paymentService.handleWebhook(rawBody, signature) }
  }
}
