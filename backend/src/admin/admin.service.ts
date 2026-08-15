import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { NotificationsService } from '../notifications/notifications.service'

const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']
const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']
const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED']
const REVIEW_STATUSES = ['APPROVED', 'HIDDEN']
const DISPUTE_STATUSES = ['OPEN', 'RESOLVED', 'DISMISSED']
const SUPPORT_STATUSES = ['OPEN', 'REPLIED', 'CLOSED']

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async getStats() {
    const [pendingArtisans, totalArtisans, totalUsers, totalBookings, hiddenReviews, openDisputes, openSupport, revenueAgg] =
      await Promise.all([
        this.prisma.artisanProfile.count({ where: { approvalStatus: 'PENDING' } }),
        this.prisma.artisanProfile.count(),
        this.prisma.user.count({ where: { status: { not: 'DELETED' } } }),
        this.prisma.booking.count(),
        this.prisma.review.count({ where: { status: 'HIDDEN' } }),
        this.prisma.dispute.count({ where: { status: 'OPEN' } }),
        this.prisma.supportMessage.count({ where: { status: 'OPEN' } }),
        this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      ])
    return {
      pendingArtisans,
      totalArtisans,
      totalUsers,
      totalBookings,
      hiddenReviews,
      openDisputes,
      openSupportMessages: openSupport,
      revenue: revenueAgg._sum.amount ?? 0,
    }
  }

  // ─── Artisan approval / verification ────────────────────────────────────────

  async listArtisans(query: any) {
    const { approvalStatus, verificationStatus, search, page = 1, limit = 50 } = query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {
      ...(approvalStatus ? { approvalStatus: String(approvalStatus) } : {}),
      ...(verificationStatus ? { verificationStatus: String(verificationStatus) } : {}),
      ...(search
        ? {
            OR: [
              { profession: { contains: String(search), mode: 'insensitive' as const } },
              { user: { is: { name: { contains: String(search), mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    }
    const [data, total] = await Promise.all([
      this.prisma.artisanProfile.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, city: true, avatar: true, status: true } } },
        orderBy: { createdAt: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.artisanProfile.count({ where }),
    ])
    return { data, total }
  }

  async setArtisanApproval(id: string, approvalStatus: string) {
    if (!APPROVAL_STATUSES.includes(approvalStatus)) throw new BadRequestException('Invalid approval status')
    const artisan = await this.prisma.artisanProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!artisan) throw new NotFoundException('Artisan not found')
    const updated = await this.prisma.artisanProfile.update({
      where: { id },
      data: { approvalStatus, verified: artisan.verificationStatus === 'VERIFIED' && approvalStatus === 'APPROVED' },
    })
    if (approvalStatus === 'APPROVED' || approvalStatus === 'REJECTED') {
      await this.emailService.sendApprovalStatusEmail({
        to: artisan.user.email,
        name: artisan.user.name,
        approvalStatus,
      })
      await this.notificationsService.create(artisan.user.id, {
        type: approvalStatus === 'APPROVED' ? 'PROFILE_APPROVED' : 'PROFILE_REJECTED',
        title: approvalStatus === 'APPROVED' ? 'Profile approved' : 'Profile rejected',
        body:
          approvalStatus === 'APPROVED'
            ? 'Your artisan profile has been approved. You can now receive booking requests.'
            : 'Your artisan profile was rejected. Please review your details and try again.',
        link: '/dashboard/artisan/profile',
      })
    }
    return updated
  }

  async setArtisanVerification(id: string, verificationStatus: string) {
    if (!VERIFICATION_STATUSES.includes(verificationStatus)) throw new BadRequestException('Invalid verification status')
    const artisan = await this.prisma.artisanProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!artisan) throw new NotFoundException('Artisan not found')
    const updated = await this.prisma.artisanProfile.update({
      where: { id },
      data: { verificationStatus, verified: verificationStatus === 'VERIFIED' },
    })
    await this.emailService.sendVerificationStatusEmail({
      to: artisan.user.email,
      name: artisan.user.name,
      verificationStatus,
    })
    if (verificationStatus === 'VERIFIED' || verificationStatus === 'REJECTED') {
      await this.notificationsService.create(artisan.user.id, {
        type: verificationStatus === 'VERIFIED' ? 'IDENTITY_VERIFIED' : 'IDENTITY_REJECTED',
        title: verificationStatus === 'VERIFIED' ? 'Identity verified' : 'Verification rejected',
        body:
          verificationStatus === 'VERIFIED'
            ? 'Your identity document was approved. You now carry the verified badge.'
            : 'Your identity document was rejected. Please review and resubmit.',
        link: '/dashboard/artisan/profile',
      })
    }
    return updated
  }

  // ─── User management / suspension ───────────────────────────────────────────

  async listUsers(query: any) {
    const { role, status, search, page = 1, limit = 50 } = query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {
      ...(role ? { role: String(role) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(search ? { OR: [{ name: { contains: String(search), mode: 'insensitive' as const } }, { email: { contains: String(search), mode: 'insensitive' as const } }] } : {}),
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, city: true, role: true, status: true, avatar: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.user.count({ where }),
    ])
    return { data, total }
  }

  async setUserStatus(id: string, status: string) {
    if (!USER_STATUSES.includes(status)) throw new BadRequestException('Invalid user status')
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    if (user.role === 'ADMIN') throw new BadRequestException('Cannot suspend an admin account')
    return this.prisma.user.update({ where: { id }, data: { status } })
  }

  async deleteUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    if (user.role === 'ADMIN') throw new BadRequestException('Cannot delete an admin account')
    if (user.id === adminId) throw new BadRequestException('You cannot delete your own account')
    if (user.status === 'DELETED') throw new BadRequestException('User is already deleted')

    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
      this.prisma.artisanProfile.updateMany({ where: { userId: id }, data: { available: false } }),
      this.prisma.user.update({
        where: { id },
        data: {
          status: 'DELETED',
          name: 'Deleted User',
          email: `deleted-${suffix}@naijahandy.local`,
          phone: null,
          city: null,
          address: null,
          avatar: null,
          password: null,
          googleId: null,
        },
      }),
    ])
    return { id: user.id, status: 'DELETED' }
  }

  // ─── Review moderation ──────────────────────────────────────────────────────

  async listReviews(query: any) {
    const { status, page = 1, limit = 50 } = query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = { ...(status ? { status: String(status) } : {}) }
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, avatar: true } },
          artisan: { include: { user: { select: { id: true, name: true } } } },
          booking: { select: { id: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.review.count({ where }),
    ])
    return { data, total }
  }

  async setReviewStatus(id: string, status: string) {
    if (!REVIEW_STATUSES.includes(status)) throw new BadRequestException('Invalid review status')
    const review = await this.prisma.review.findUnique({ where: { id } })
    if (!review) throw new NotFoundException('Review not found')
    return this.prisma.review.update({ where: { id }, data: { status } })
  }

  // ─── Bookings & payments ────────────────────────────────────────────────────

  async listBookings(query: any) {
    const { status, page = 1, limit = 50 } = query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = { ...(status ? { status: String(status) } : {}) }
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          artisan: { include: { user: { select: { id: true, name: true } } } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.booking.count({ where }),
    ])
    return { data, total }
  }

  async listPayments() {
    return this.prisma.payment.findMany({
      include: { booking: { select: { id: true, description: true, amount: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  // ─── Disputes ───────────────────────────────────────────────────────────────

  async listDisputes(query: any) {
    const { status, page = 1, limit = 50 } = query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = { ...(status ? { status: String(status) } : {}) }
    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          booking: { include: { artisan: { include: { user: { select: { id: true, name: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.dispute.count({ where }),
    ])
    return { data, total }
  }

  async resolveDispute(id: string, status: string, resolution?: string) {
    if (!DISPUTE_STATUSES.includes(status) || status === 'OPEN') {
      throw new BadRequestException('Status must be RESOLVED or DISMISSED')
    }
    const dispute = await this.prisma.dispute.findUnique({ where: { id } })
    if (!dispute) throw new NotFoundException('Dispute not found')
    return this.prisma.dispute.update({ where: { id }, data: { status, resolution: resolution || null } })
  }

  // ─── Support inbox ──────────────────────────────────────────────────────────

  async listSupportMessages(query: any) {
    const { status, page = 1, limit = 50 } = query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = { ...(status ? { status: String(status) } : {}) }
    const [data, total] = await Promise.all([
      this.prisma.supportMessage.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.supportMessage.count({ where }),
    ])
    return { data, total }
  }

  async setSupportMessageStatus(id: string, status: string) {
    if (!SUPPORT_STATUSES.includes(status)) throw new BadRequestException('Invalid support message status')
    const message = await this.prisma.supportMessage.findUnique({ where: { id } })
    if (!message) throw new NotFoundException('Support message not found')
    return this.prisma.supportMessage.update({ where: { id }, data: { status } })
  }
}
