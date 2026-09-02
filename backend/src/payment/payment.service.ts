import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { createHmac, timingSafeEqual, randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreditsService } from '../credits/credits.service'
import { PLATFORM_FEE } from '../domain/booking'
import { PAYSTACK } from '../config'

const SECRET_KEY = PAYSTACK.secretKey
const BASE_URL = PAYSTACK.baseUrl
const CALLBACK_URL = PAYSTACK.callbackUrl
const MOCK = PAYSTACK.mock
// Hard ceiling on outbound Paystack calls so a slow gateway never hangs a request.
const PAYSTACK_TIMEOUT_MS = 15000

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
      signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
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
        signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
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
    // Fetch the recipients once up front so we don't repeat lookups below.
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, artisan: { select: { userId: true } } },
    })

    // Payment success + booking PAID + credit debit are one atomic unit — no
    // partial state if any step fails.
    const payment = await this.prisma.$transaction(async (tx) => {
      const pay = await tx.payment.update({
        where: { bookingId },
        data: { status: 'SUCCESS', paidAt: new Date(), escrowStatus: 'HELD', escrowHeldAt: new Date() },
      })
      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'PAID', paymentReference: pay.reference, paidAt: new Date() },
      })

      // Debit applied credits (only once — this method is idempotency-gated by
      // the callers). Balance was validated at initialize time, but guard anyway.
      if (pay.creditsApplied > 0 && booking) {
        const customer = await tx.user.findUnique({
          where: { id: booking.customerId },
          select: { creditBalance: true },
        })
        const current = customer?.creditBalance ?? 0
        if (current < pay.creditsApplied) throw new BadRequestException('Insufficient credit balance')
        const balance = current - pay.creditsApplied
        await tx.user.update({ where: { id: booking.customerId }, data: { creditBalance: balance } })
        await tx.creditTransaction.create({
          data: {
            userId: booking.customerId,
            amount: -pay.creditsApplied,
            type: 'USED',
            bookingId,
            balanceAfter: balance,
            note: `Applied to booking ${bookingId}`,
          },
        })
      }

      return pay
    })

    if (booking) {
      await this.notificationsService.create(booking.artisan.userId, {
        type: 'PAYMENT_RECEIVED',
        title: 'Payment received',
        body: `Payment of ₦${payment.grossAmount.toLocaleString('en-NG')} received and held in escrow — it is released to you when you complete the job.`,
        link: '/dashboard/artisan/requests',
      })
    }

    return payment
  }

  // Releases a held escrow payment to the artisan (payout = gross − platform fee).
  // Idempotent: only transitions HELD → RELEASED.
  async releaseEscrow(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { bookingId } })
    if (!payment || payment.escrowStatus !== 'HELD') return payment

    const payoutAmount = Math.max((payment.grossAmount ?? 0) - PLATFORM_FEE, 0)
    // The DB write and the notification lookup are independent — run in parallel.
    const [updated, booking] = await Promise.all([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { escrowStatus: 'RELEASED', escrowReleasedAt: new Date(), payoutAmount },
      }),
      this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { artisan: { select: { userId: true } } },
      }),
    ])
    if (booking) {
      await this.notificationsService.create(booking.artisan.userId, {
        type: 'PAYMENT_RELEASED',
        title: 'Payment released',
        body: `Your payment of ₦${payoutAmount.toLocaleString('en-NG')} has been released — it is now yours.`,
        link: '/dashboard/artisan/requests',
      })
    }

    return updated
  }

  // Refunds a held escrow payment to the customer and returns any applied credits.
  // Idempotent: only transitions HELD → REFUNDED.
  async refundEscrow(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { bookingId } })
    if (!payment || payment.escrowStatus !== 'HELD') return payment

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true },
    })

    // The refund + booking status flip are one atomic unit.
    const updated = await this.prisma.$transaction(async (tx) => {
      const up = await tx.payment.update({
        where: { id: payment.id },
        data: { escrowStatus: 'REFUNDED', escrowRefundedAt: new Date(), status: 'REFUNDED' },
      })
      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'REFUNDED' },
      })

      // Restore credits that were applied to this booking (platform-funded discount).
      if (payment.creditsApplied > 0 && booking) {
        const customer = await tx.user.findUnique({
          where: { id: booking.customerId },
          select: { creditBalance: true },
        })
        const balance = (customer?.creditBalance ?? 0) + payment.creditsApplied
        await tx.user.update({ where: { id: booking.customerId }, data: { creditBalance: balance } })
        await tx.creditTransaction.create({
          data: {
            userId: booking.customerId,
            amount: payment.creditsApplied,
            type: 'EARNED',
            bookingId,
            balanceAfter: balance,
            note: 'Refund — applied credits returned',
          },
        })
      }

      return up
    })

    if (booking) {
      await this.notificationsService.create(booking.customerId, {
        type: 'PAYMENT_REFUNDED',
        title: 'Payment refunded',
        body: `₦${payment.grossAmount.toLocaleString('en-NG')} was refunded to you because the booking was not completed.`,
        link: '/bookings',
      })
    }

    return updated
  }
}
