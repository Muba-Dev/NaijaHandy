import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { createHmac, timingSafeEqual, randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreditsService } from '../credits/credits.service'

const SECRET_KEY = () => process.env.PAYSTACK_SECRET_KEY || ''
const BASE_URL = () => process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co'
const CALLBACK_URL = () => process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/bookings'
const MOCK = () => process.env.PAYSTACK_MOCK === 'true'

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private creditsService: CreditsService,
  ) {}

  async initialize(userId: string, bookingId: string, creditsToApply = 0) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: { select: { email: true, creditBalance: true } }, payment: true },
    })
    if (!booking) throw new NotFoundException('Booking not found')
    if (booking.customerId !== userId) throw new ForbiddenException('You cannot pay for this booking')
    if (booking.paymentStatus === 'PAID' || booking.payment?.status === 'SUCCESS') {
      throw new BadRequestException('Booking already paid')
    }

    const grossAmount = booking.amount
    const credits = Math.min(creditsToApply, grossAmount)
    if (credits > 0 && credits > (booking.customer.creditBalance ?? 0)) {
      throw new BadRequestException('Insufficient credit balance')
    }
    const amount = grossAmount - credits

    const reference = `pay_${randomUUID().replace(/-/g, '')}`
    const payment = await this.prisma.payment.upsert({
      where: { bookingId },
      update: { reference, amount, grossAmount, creditsApplied: credits, status: 'PENDING' },
      create: { bookingId, reference, amount, grossAmount, creditsApplied: credits, status: 'PENDING', provider: 'PAYSTACK' },
    })

    if (MOCK()) {
      return { authorization_url: `${CALLBACK_URL()}?reference=${payment.reference}`, reference: payment.reference }
    }

    const response = await fetch(`${BASE_URL()}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET_KEY()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount * 100,
        email: booking.customer.email,
        reference,
        metadata: { bookingId: booking.id, customerId: userId },
        callback_url: CALLBACK_URL(),
      }),
    })
    const json: any = await response.json()
    if (!response.ok || !json.status) {
      throw new BadRequestException(json.message || 'Failed to initialize payment')
    }
    return { authorization_url: json.data.authorization_url, reference: json.data.reference }
  }

  async verify(reference: string, userId: string, role: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { booking: { select: { customerId: true } } },
    })
    if (!payment) throw new NotFoundException('Payment not found')
    if (role !== 'ADMIN' && payment.booking.customerId !== userId) {
      throw new ForbiddenException('You cannot verify this payment')
    }
    if (payment.status === 'SUCCESS') return payment

    let ok = true
    if (!MOCK()) {
      const response = await fetch(`${BASE_URL()}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${SECRET_KEY()}` },
      })
      const json: any = await response.json()
      if (!response.ok || !json.status) throw new BadRequestException(json.message || 'Verification failed')
      ok = json.data.status === 'success' && Number(json.data.amount) === payment.amount * 100
    }

    if (!ok) {
      return this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
    }
    return this.finalizePayment(payment.bookingId)
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!MOCK()) {
      if (!signature) throw new UnauthorizedException('Missing signature')
      const expected = createHmac('sha512', SECRET_KEY()).update(rawBody).digest('hex')
      if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        throw new UnauthorizedException('Invalid signature')
      }
    }

    const event = JSON.parse(rawBody.toString('utf8'))
    if (event.event !== 'charge.success') return { received: true, event: event.event }

    const txn = event.data
    const bookingId = txn?.metadata?.bookingId
    if (!bookingId) return { received: true, ignored: 'no bookingId' }

    const payment = await this.prisma.payment.findFirst({ where: { bookingId } })
    if (!payment) throw new NotFoundException('Payment not found')
    if (payment.status === 'SUCCESS') return { received: true, duplicate: true }

    if (txn.status !== 'success' || Number(txn.amount) !== payment.amount * 100) {
      return this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
    }
    return this.finalizePayment(bookingId)
  }

  private async finalizePayment(bookingId: string) {
    const payment = await this.prisma.payment.update({
      where: { bookingId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    })
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'PAID', paymentReference: payment.reference, paidAt: new Date() },
    })

    // Debit applied credits (only once — this method is idempotency-gated by the callers).
    if (payment.creditsApplied > 0) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { customerId: true },
      })
      if (booking) {
        await this.creditsService.use(
          booking.customerId,
          payment.creditsApplied,
          bookingId,
          `Applied to booking ${bookingId}`,
        )
      }
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { artisan: { select: { userId: true } } },
    })
    if (booking) {
      await this.notificationsService.create(booking.artisan.userId, {
        type: 'PAYMENT_RECEIVED',
        title: 'Payment received',
        body: `You have been paid ₦${payment.grossAmount.toLocaleString('en-NG')} for a booking.`,
        link: '/dashboard/artisan/requests',
      })
    }

    return payment
  }
}
