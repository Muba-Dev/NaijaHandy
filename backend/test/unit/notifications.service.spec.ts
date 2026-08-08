import { NotificationsService } from '../../src/notifications/notifications.service'
import { NotFoundException } from '@nestjs/common'

describe('NotificationsService', () => {
  const notification = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  }
  const prisma = { notification } as any
  const service = new NotificationsService(prisma)

  afterEach(() => jest.clearAllMocks())

  describe('create', () => {
    it('creates a notification for the user', async () => {
      notification.create.mockResolvedValue({ id: 'n1', userId: 'u1', type: 'BOOKING_REQUEST' })
      await expect(
        service.create('u1', { type: 'BOOKING_REQUEST', title: 'New booking request', body: 'You have a new booking.', link: '/bookings' }),
      ).resolves.toEqual({ id: 'n1', userId: 'u1', type: 'BOOKING_REQUEST' })
      expect(notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'BOOKING_REQUEST',
          title: 'New booking request',
          body: 'You have a new booking.',
          link: '/bookings',
        },
      })
    })

    it('stores a null link when none is provided', async () => {
      notification.create.mockResolvedValue({ id: 'n1' })
      await service.create('u1', { type: 'REVIEW_RECEIVED', title: 'New review', body: 'Someone reviewed you.' })
      expect(notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'REVIEW_RECEIVED',
          title: 'New review',
          body: 'Someone reviewed you.',
          link: null,
        },
      })
    })
  })

  describe('findAll', () => {
    it('returns the user notifications newest first', async () => {
      notification.findMany.mockResolvedValue([{ id: 'n2' }, { id: 'n1' }])
      await expect(service.findAll('u1')).resolves.toEqual([{ id: 'n2' }, { id: 'n1' }])
      expect(notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    })
  })

  describe('unreadCount', () => {
    it('counts only unread notifications', async () => {
      notification.count.mockResolvedValue(3)
      await expect(service.unreadCount('u1')).resolves.toBe(3)
      expect(notification.count).toHaveBeenCalledWith({ where: { userId: 'u1', read: false } })
    })
  })

  describe('markRead', () => {
    it('marks a notification owned by the user as read', async () => {
      notification.findFirst.mockResolvedValue({ id: 'n1', userId: 'u1', read: false })
      notification.update.mockResolvedValue({ id: 'n1', read: true })
      await service.markRead('u1', 'n1')
      expect(notification.findFirst).toHaveBeenCalledWith({ where: { id: 'n1', userId: 'u1' } })
      expect(notification.update).toHaveBeenCalledWith({ where: { id: 'n1' }, data: { read: true } })
    })

    it('throws when the notification does not belong to the user', async () => {
      notification.findFirst.mockResolvedValue(null)
      await expect(service.markRead('u1', 'n1')).rejects.toThrow(NotFoundException)
      expect(notification.update).not.toHaveBeenCalled()
    })
  })

  describe('markAllRead', () => {
    it('marks every unread notification as read', async () => {
      notification.updateMany.mockResolvedValue({ count: 4 })
      await expect(service.markAllRead('u1')).resolves.toEqual({ success: true })
      expect(notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', read: false },
        data: { read: true },
      })
    })
  })
})
