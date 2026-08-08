import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export const NOTIFICATION_TYPES = [
  'BOOKING_REQUEST',
  'BOOKING_ACCEPTED',
  'BOOKING_DECLINED',
  'BOOKING_CANCELLED',
  'BOOKING_COMPLETED',
  'REVIEW_RECEIVED',
  'PROFILE_APPROVED',
  'PROFILE_REJECTED',
  'PAYMENT_RECEIVED',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type CreateNotificationInput = {
  type: NotificationType
  title: string
  body: string
  link?: string
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link || null,
      },
    })
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } })
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    })
    if (!notification) throw new NotFoundException('Notification not found')
    return this.prisma.notification.update({ where: { id }, data: { read: true } })
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    return { success: true }
  }
}
