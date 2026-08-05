import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BOOKING_STATUSES, canTransitionBookingStatus } from '../domain/booking'

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    return this.prisma.booking.create({
      data: {
        customerId: userId,
        artisanId: data.artisanId,
        date: new Date(data.date),
        time: data.time,
        description: data.description,
        amount: data.amount,
      },
    })
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
        payment: { select: { status: true, reference: true } },
        review: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateStatus(userId: string, role: string, bookingId: string, status: string) {
    const current = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { artisan: { select: { userId: true } } },
    })
    if (!current) throw new NotFoundException('Booking not found')

    const isCustomer = current.customerId === userId
    const isArtisan = current.artisan.userId === userId
    const customerCanCancel = isCustomer && status === 'CANCELLED'
    const artisanCanUpdate = isArtisan && ['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)
    if (!customerCanCancel && !artisanCanUpdate) {
      throw new ForbiddenException('You cannot update this booking')
    }
    if (!canTransitionBookingStatus(current.status, status)) {
      throw new ForbiddenException(`Cannot change booking from ${current.status} to ${status}`)
    }
    if (status === 'CONFIRMED' && current.paymentStatus !== 'PAID') {
      throw new ForbiddenException('Booking must be paid before it can be confirmed')
    }

    return this.prisma.booking.update({ where: { id: bookingId }, data: { status } })
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

  async createReview(userId: string, bookingId: string, rating: number, comment: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new NotFoundException('Booking not found')
    if (booking.customerId !== userId) throw new ForbiddenException('You cannot review this booking')
    if (booking.status !== 'COMPLETED') throw new ForbiddenException('You can only review completed bookings')

    const existing = await this.prisma.review.findUnique({ where: { bookingId } })
    if (existing) throw new ForbiddenException('This booking has already been reviewed')

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: { bookingId, customerId: userId, artisanId: booking.artisanId, rating, comment },
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

      return review
    })
  }
}
