import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { NotificationsService } from '../notifications/notifications.service'
import { UploadService } from '../upload/upload.service'
import { CreditsService } from '../credits/credits.service'
import { PaymentService } from '../payment/payment.service'
import { BOOKING_STATUSES, canTransitionBookingStatus, CANCELLATION_GRACE_HOURS } from '../domain/booking'

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private uploadService: UploadService,
    private creditsService: CreditsService,
    private paymentService: PaymentService,
  ) {}

  async create(userId: string, data: any) {
    const artisanProfile = await this.prisma.artisanProfile.findUnique({
      where: { id: data.artisanId },
      select: { userId: true },
    })
    if (!artisanProfile) throw new NotFoundException('Artisan not found')

    const booking = await this.prisma.booking.create({
      data: {
        customerId: userId,
        artisanId: data.artisanId,
        date: new Date(data.date),
        time: data.time,
        description: data.description,
        amount: data.amount,
        address: data.address ?? null,
        customerPhone: data.customerPhone ?? null,
        isUrgent: data.isUrgent ?? false,
      },
    })

    if (artisanProfile.userId !== userId) {
      await this.notificationsService.create(artisanProfile.userId, {
        type: data.isUrgent ? 'URGENT_REQUEST' : 'BOOKING_REQUEST',
        title: data.isUrgent ? 'Urgent booking request' : 'New booking request',
        body: data.isUrgent
          ? 'Urgent booking request — the customer needs this job done today. Review and confirm it quickly.'
          : 'You have a new booking request. Review and confirm it to get started.',
        link: '/dashboard/artisan/requests',
      })
    }

    return booking
  }

  async findAll(userId: string, role: string, query: any) {
    const { status, page = 1, limit = 200 } = query
    // Bound responses — active bookings per user are modest, but never allow an
    // unbounded payload. Default 200 far exceeds realistic usage while keeping
    // the array shape the frontend relies on for its local tab filtering.
    const take = Math.min(Math.max(Number(limit) || 200, 1), 500)
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take
    const isArtisan = role === 'ARTISAN'
    const profile = isArtisan
      ? await this.prisma.artisanProfile.findUnique({ where: { userId }, select: { id: true } })
      : null

    return this.prisma.booking.findMany({
      where: {
        ...(isArtisan ? { artisanId: profile?.id } : { customerId: userId }),
        ...(status ? { status: String(status) as any } : {}),
      },
      include: {
        artisan: { include: { user: { select: { name: true, avatar: true } } } },
        customer: { select: { name: true, avatar: true } },
        payment: { select: { status: true, reference: true, escrowStatus: true } },
        review: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  }

  async updateStatus(userId: string, role: string, bookingId: string, status: string) {
    const current = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        artisan: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })
    if (!current) throw new NotFoundException('Booking not found')

    const isCustomer = current.customerId === userId
    const isArtisan = current.artisan.userId === userId
    const customerCanCancel = isCustomer && status === 'CANCELLED'
    const artisanCanUpdate = isArtisan && ['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(status)
    if (!customerCanCancel && !artisanCanUpdate) {
      throw new ForbiddenException('You cannot update this booking')
    }
    if (!canTransitionBookingStatus(current.status, status)) {
      throw new ForbiddenException(`Cannot change booking from ${current.status} to ${status}`)
    }

    // Cancellation grace period: a customer may freely cancel a PENDING booking,
    // but a CONFIRMED booking can only be cancelled within the window after it
    // was confirmed (full refund). Legacy/unset timestamps are treated as within
    // grace so older bookings remain cancellable as before.
    if (status === 'CANCELLED' && isCustomer && current.status === 'CONFIRMED') {
      const anchor = current.confirmedAt || current.createdAt
      const windowMs = CANCELLATION_GRACE_HOURS * 60 * 60 * 1000
      if (anchor && Date.now() - new Date(anchor).getTime() > windowMs) {
        throw new ForbiddenException(
          `Cancellation window of ${CANCELLATION_GRACE_HOURS} hours after confirmation has passed. Please contact support for help.`,
        )
      }
    }

    // Optimistic concurrency: guard the write on the `updatedAt` we just read so a
    // concurrent status change (e.g. artisan confirms while the customer cancels)
    // is detected instead of silently lost. When it clashes, abort before any
    // escrow/notification side effects and tell the client to refresh + retry.
    let updated
    try {
      updated = await this.prisma.booking.update({
        where: { id: bookingId, updatedAt: current.updatedAt },
        data: status === 'CONFIRMED' ? { status, confirmedAt: new Date() } : { status },
      })
    } catch (err) {
      if ((err as { code?: string })?.code === 'P2025') {
        throw new ConflictException(
          'This booking was updated by someone else. Refresh and try again.',
        )
      }
      throw err
    }

    // Escrow lifecycle: completing a paid job releases the held payment to the
    // artisan; cancelling a paid job refunds it to the customer. Release and
    // the loyalty-credit award are independent — run in parallel.
    if (status === 'COMPLETED' && current.paymentStatus === 'PAID') {
      await Promise.all([
        this.paymentService.releaseEscrow(bookingId),
        current.customerId !== current.artisan.userId
          ? this.creditsService.award(
              current.customerId,
              CreditsService.rewardFor(current.amount),
              bookingId,
              '5% back on a completed booking',
            )
          : Promise.resolve(),
      ])
    }
    if (status === 'CANCELLED' && current.paymentStatus === 'PAID') {
      await this.paymentService.refundEscrow(bookingId)
    }

    const recipient = isArtisan ? current.customer : current.artisan.user
    const notifications: Record<string, { type: any; title: string; body: string; link: string }> = {
      CONFIRMED: {
        type: 'BOOKING_ACCEPTED',
        title: 'Booking confirmed',
        body: `Your booking with ${current.artisan.user.name} has been confirmed.`,
        link: '/bookings',
      },
      REJECTED: {
        type: 'BOOKING_DECLINED',
        title: 'Booking declined',
        body: `${current.artisan.user.name} declined your booking request.`,
        link: '/bookings',
      },
      COMPLETED: {
        type: 'BOOKING_COMPLETED',
        title: 'Booking completed',
        body: `Your booking with ${current.artisan.user.name} is complete. Please leave a review.`,
        link: '/bookings',
      },
    }

    let notify: Promise<unknown> = Promise.resolve()
    if (status === 'CANCELLED') {
      notify = isCustomer
        ? this.notificationsService.create(current.artisan.user.id, {
            type: 'BOOKING_CANCELLED',
            title: 'Booking cancelled',
            body: `${current.customer.name} cancelled their booking.`,
            link: '/dashboard/artisan/requests',
          })
        : this.notificationsService.create(current.customer.id, {
            type: 'BOOKING_CANCELLED',
            title: 'Booking cancelled',
            body: `${current.artisan.user.name} cancelled your booking.`,
            link: '/bookings',
          })
    } else if (notifications[status]) {
      notify = this.notificationsService.create(recipient.id, notifications[status])
    }

    // Email + in-app notification are independent — don't serialize them.
    await Promise.all([
      this.emailService.sendBookingStatusEmail({
        to: recipient.email,
        status,
        booking: {
          id: bookingId,
          artisanName: current.artisan.user.name,
          customerName: current.customer.name,
          date: current.date,
          time: current.time,
          amount: current.amount,
        },
      }),
      notify,
    ])

    return updated
  }

  async raiseDispute(userId: string, bookingId: string, reason: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new NotFoundException('Booking not found')
    if (booking.customerId !== userId) throw new ForbiddenException('You cannot dispute this booking')

    const open = await this.prisma.dispute.findFirst({ where: { bookingId, status: 'OPEN' } })
    if (open) throw new ForbiddenException('A dispute for this booking is already open')

    return this.prisma.dispute.create({
      data: { bookingId, raisedBy: userId, reason },
    })
  }

  async createReview(userId: string, bookingId: string, rating: number, comment: string, photoUrl?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { name: true } },
        artisan: { include: { user: { select: { id: true } } } },
      },
    })
    if (!booking) throw new NotFoundException('Booking not found')
    if (booking.customerId !== userId) throw new ForbiddenException('You cannot review this booking')
    if (booking.status !== 'COMPLETED') throw new ForbiddenException('You can only review completed bookings')

    const existing = await this.prisma.review.findUnique({ where: { bookingId } })
    if (existing) throw new ForbiddenException('This booking has already been reviewed')

    const storedPhotoUrl = photoUrl ? await this.uploadService.uploadReviewPhoto(photoUrl) : null

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { bookingId, customerId: userId, artisanId: booking.artisanId, rating, comment, photoUrl: storedPhotoUrl },
      })

      const profile = await tx.artisanProfile.findUnique({
        where: { id: booking.artisanId },
        select: { avgRating: true, totalReviews: true },
      })
      if (profile) {
        const total = profile.totalReviews + 1
        const newAvg = (profile.avgRating * profile.totalReviews + rating) / total
        await tx.artisanProfile.update({
          where: { id: booking.artisanId },
          data: { totalReviews: total, avgRating: Math.round(newAvg * 100) / 100 },
        })
      }

      return created
    })

    await this.notificationsService.create(booking.artisan.user.id, {
      type: 'REVIEW_RECEIVED',
      title: 'New review',
      body: `${booking.customer.name} left you a ${rating}-star review.`,
      link: `/artisans/${booking.artisanId}`,
    })

    return review
  }
}
