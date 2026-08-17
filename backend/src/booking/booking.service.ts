import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { NotificationsService } from '../notifications/notifications.service'
import { UploadService } from '../upload/upload.service'
import { CreditsService } from '../credits/credits.service'
import { PaymentService } from '../payment/payment.service'
import { BOOKING_STATUSES, canTransitionBookingStatus } from '../domain/booking'

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
    const { status } = query
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

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data: { status } })

    // Escrow lifecycle: completing a paid job releases the held payment to the
    // artisan; cancelling a paid job refunds it to the customer.
    if (status === 'COMPLETED' && current.paymentStatus === 'PAID') {
      await this.paymentService.releaseEscrow(bookingId)
    }
    if (status === 'CANCELLED' && current.paymentStatus === 'PAID') {
      await this.paymentService.refundEscrow(bookingId)
    }

    // Reward loyalty credits on a paid, completed job (skip self-bookings).
    if (status === 'COMPLETED' && current.paymentStatus === 'PAID' && current.customerId !== current.artisan.userId) {
      await this.creditsService.award(
        current.customerId,
        CreditsService.rewardFor(current.amount),
        bookingId,
        '5% back on a completed booking',
      )
    }

    const recipient = isArtisan ? current.customer : current.artisan.user
    await this.emailService.sendBookingStatusEmail({
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
    })

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
    if (status === 'CANCELLED') {
      if (isCustomer) {
        await this.notificationsService.create(current.artisan.user.id, {
          type: 'BOOKING_CANCELLED',
          title: 'Booking cancelled',
          body: `${current.customer.name} cancelled their booking.`,
          link: '/dashboard/artisan/requests',
        })
      } else {
        await this.notificationsService.create(current.customer.id, {
          type: 'BOOKING_CANCELLED',
          title: 'Booking cancelled',
          body: `${current.artisan.user.name} cancelled your booking.`,
          link: '/bookings',
        })
      }
    } else if (notifications[status]) {
      await this.notificationsService.create(recipient.id, notifications[status])
    }

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
