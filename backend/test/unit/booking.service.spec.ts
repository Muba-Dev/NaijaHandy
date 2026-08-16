import { BookingService } from '../../src/booking/booking.service'
import { ForbiddenException, NotFoundException } from '@nestjs/common'

describe('BookingService', () => {
  const booking = { findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn(), create: jest.fn() }
  const dispute = { findFirst: jest.fn(), create: jest.fn() }
  const review = { findUnique: jest.fn() }
  const artisanProfile = { findUnique: jest.fn() }
  const prisma = { booking, dispute, review, artisanProfile } as any
  const emailService = { sendBookingStatusEmail: jest.fn() } as any
  const notificationsService = { create: jest.fn() } as any
  const uploadService = { uploadReviewPhoto: jest.fn() } as any
  const creditsService = { award: jest.fn() } as any
  const service = new BookingService(prisma, emailService, notificationsService, uploadService, creditsService)

  const baseBooking = {
    id: 'b1',
    artisanId: 'art-1',
    customerId: 'c1',
    paymentStatus: 'UNPAID',
    status: 'PENDING',
    date: new Date('2026-08-20T09:00:00.000Z'),
    time: '9:00 AM',
    amount: 17000,
    customer: { id: 'c1', name: 'Chisom Eze', email: 'chisom@example.com' },
    artisan: { id: 'art-1', userId: 'a1', user: { id: 'a1', name: 'Emeka Okafor', email: 'emeka@example.com' } },
  }

  afterEach(() => jest.clearAllMocks())

  describe('updateStatus', () => {
    it('throws NotFoundException for a missing booking', async () => {
      booking.findUnique.mockResolvedValue(null)
      await expect(service.updateStatus('c1', 'CUSTOMER', 'b1', 'CANCELLED')).rejects.toThrow(NotFoundException)
    })

    it('blocks a customer from confirming their own booking', async () => {
      booking.findUnique.mockResolvedValue(baseBooking)
      await expect(service.updateStatus('c1', 'CUSTOMER', 'b1', 'CONFIRMED')).rejects.toThrow(ForbiddenException)
    })

    it('blocks a stranger from updating the booking', async () => {
      booking.findUnique.mockResolvedValue(baseBooking)
      await expect(service.updateStatus('c9', 'CUSTOMER', 'b1', 'CANCELLED')).rejects.toThrow('You cannot update this booking')
    })

    it('blocks CONFIRMED until the booking is PAID', async () => {
      booking.findUnique.mockResolvedValue(baseBooking)
      await expect(service.updateStatus('a1', 'ARTISAN', 'b1', 'CONFIRMED')).rejects.toThrow(
        'Booking must be paid before it can be confirmed',
      )
    })

    it('allows CONFIRMED once the booking is PAID', async () => {
      booking.findUnique.mockResolvedValue({ ...baseBooking, paymentStatus: 'PAID' })
      booking.update.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' })
      await expect(service.updateStatus('a1', 'ARTISAN', 'b1', 'CONFIRMED')).resolves.toEqual({
        id: 'b1',
        status: 'CONFIRMED',
      })
      expect(emailService.sendBookingStatusEmail).toHaveBeenCalledWith({
        to: 'chisom@example.com',
        status: 'CONFIRMED',
        booking: expect.objectContaining({ artisanName: 'Emeka Okafor', customerName: 'Chisom Eze' }),
      })
      expect(notificationsService.create).toHaveBeenCalledWith('c1', {
        type: 'BOOKING_ACCEPTED',
        title: 'Booking confirmed',
        body: expect.any(String),
        link: '/bookings',
      })
    })

    it('blocks an invalid state transition', async () => {
      booking.findUnique.mockResolvedValue({ ...baseBooking, status: 'COMPLETED', paymentStatus: 'PAID' })
      await expect(service.updateStatus('a1', 'ARTISAN', 'b1', 'CONFIRMED')).rejects.toThrow(
        'Cannot change booking from COMPLETED to CONFIRMED',
      )
    })

    it('lets the customer cancel their own pending booking', async () => {
      booking.findUnique.mockResolvedValue(baseBooking)
      booking.update.mockResolvedValue({ id: 'b1', status: 'CANCELLED' })
      await expect(service.updateStatus('c1', 'CUSTOMER', 'b1', 'CANCELLED')).resolves.toEqual({
        id: 'b1',
        status: 'CANCELLED',
      })
      expect(emailService.sendBookingStatusEmail).toHaveBeenCalledWith({
        to: 'emeka@example.com',
        status: 'CANCELLED',
        booking: expect.objectContaining({ artisanName: 'Emeka Okafor', customerName: 'Chisom Eze' }),
      })
      expect(notificationsService.create).toHaveBeenCalledWith('a1', {
        type: 'BOOKING_CANCELLED',
        title: 'Booking cancelled',
        body: expect.any(String),
        link: '/dashboard/artisan/requests',
      })
    })

    it('lets the artisan reject a pending booking and notifies the customer', async () => {
      booking.findUnique.mockResolvedValue(baseBooking)
      booking.update.mockResolvedValue({ id: 'b1', status: 'REJECTED' })
      await expect(service.updateStatus('a1', 'ARTISAN', 'b1', 'REJECTED')).resolves.toEqual({
        id: 'b1',
        status: 'REJECTED',
      })
      expect(emailService.sendBookingStatusEmail).toHaveBeenCalledWith({
        to: 'chisom@example.com',
        status: 'REJECTED',
        booking: expect.objectContaining({ artisanName: 'Emeka Okafor', customerName: 'Chisom Eze' }),
      })
      expect(notificationsService.create).toHaveBeenCalledWith('c1', {
        type: 'BOOKING_DECLINED',
        title: 'Booking declined',
        body: expect.any(String),
        link: '/bookings',
      })
    })

    it('awards loyalty credits to the customer when a paid booking is completed', async () => {
      booking.findUnique.mockResolvedValue({ ...baseBooking, status: 'CONFIRMED', paymentStatus: 'PAID' })
      booking.update.mockResolvedValue({ id: 'b1', status: 'COMPLETED' })
      creditsService.award.mockResolvedValue([{}, {}])

      await expect(service.updateStatus('a1', 'ARTISAN', 'b1', 'COMPLETED')).resolves.toEqual({
        id: 'b1',
        status: 'COMPLETED',
      })
      expect(creditsService.award).toHaveBeenCalledWith('c1', expect.any(Number), 'b1', expect.any(String))
    })

    it('does not award credits for unpaid or self-booked completed jobs', async () => {
      booking.findUnique.mockResolvedValue({
        ...baseBooking,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        customerId: 'a1',
        artisan: { id: 'art-1', userId: 'a1', user: { id: 'a1', name: 'Emeka', email: 'emeka@example.com' } },
      })
      booking.update.mockResolvedValue({ id: 'b1', status: 'COMPLETED' })

      await service.updateStatus('a1', 'ARTISAN', 'b1', 'COMPLETED')
      expect(creditsService.award).not.toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('creates the booking and notifies the artisan of the request', async () => {
      artisanProfile.findUnique.mockResolvedValue({ userId: 'a1' })
      booking.create.mockResolvedValue({ id: 'b1', customerId: 'c1', artisanId: 'art-1' })

      await service.create('c1', {
        artisanId: 'art-1',
        date: '2026-08-20',
        time: '9:00 AM',
        description: 'Fix a leak',
        amount: 17000,
        address: '12 Admiralty Way, Lekki',
        customerPhone: '08012345678',
      })

      expect(booking.create).toHaveBeenCalledWith({
        data: {
          customerId: 'c1',
          artisanId: 'art-1',
          date: expect.any(Date),
          time: '9:00 AM',
          description: 'Fix a leak',
          amount: 17000,
          address: '12 Admiralty Way, Lekki',
          customerPhone: '08012345678',
          isUrgent: false,
        },
      })
      expect(notificationsService.create).toHaveBeenCalledWith('a1', {
        type: 'BOOKING_REQUEST',
        title: 'New booking request',
        body: expect.any(String),
        link: '/dashboard/artisan/requests',
      })
    })

    it('stores null contact fields when not provided', async () => {
      artisanProfile.findUnique.mockResolvedValue({ userId: 'a1' })
      booking.create.mockResolvedValue({ id: 'b1', customerId: 'c1', artisanId: 'art-1' })

      await service.create('c1', { artisanId: 'art-1', date: '2026-08-20', time: '9:00 AM', description: 'Fix a leak', amount: 17000 })

      expect(booking.create).toHaveBeenCalledWith({
        data: {
          customerId: 'c1',
          artisanId: 'art-1',
          date: expect.any(Date),
          time: '9:00 AM',
          description: 'Fix a leak',
          amount: 17000,
          address: null,
          customerPhone: null,
          isUrgent: false,
        },
      })
    })

    it('throws when the artisan profile does not exist', async () => {
      artisanProfile.findUnique.mockResolvedValue(null)
      await expect(service.create('c1', { artisanId: 'art-1', date: '2026-08-20', time: '9:00 AM', description: 'Fix a leak', amount: 17000 })).rejects.toThrow(NotFoundException)
      expect(booking.create).not.toHaveBeenCalled()
    })

    it('creates an urgent booking with an urgent request notification', async () => {
      artisanProfile.findUnique.mockResolvedValue({ userId: 'a1' })
      booking.create.mockResolvedValue({ id: 'b2', customerId: 'c1', artisanId: 'art-1' })
      await service.create('c1', {
        artisanId: 'art-1',
        date: '2026-08-20',
        time: '9:00 AM',
        description: 'Fix a leaking kitchen pipe',
        amount: 17000,
        isUrgent: true,
      })
      expect(booking.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isUrgent: true }) }),
      )
      expect(notificationsService.create).toHaveBeenCalledWith('a1', {
        type: 'URGENT_REQUEST',
        title: 'Urgent booking request',
        body: expect.any(String),
        link: '/dashboard/artisan/requests',
      })
    })

    it('does not notify when the artisan books themselves', async () => {
      artisanProfile.findUnique.mockResolvedValue({ userId: 'c1' })
      booking.create.mockResolvedValue({ id: 'b3', customerId: 'c1', artisanId: 'art-1' })
      await service.create('c1', { artisanId: 'art-1', date: '2026-08-20', time: '9:00 AM', description: 'Fix a leak', amount: 17000, isUrgent: true })
      expect(notificationsService.create).not.toHaveBeenCalled()
    })
  })

  describe('createReview', () => {
    it('creates the review and notifies the artisan', async () => {
      booking.findUnique.mockResolvedValue({
        ...baseBooking,
        status: 'COMPLETED',
        customer: { id: 'c1', name: 'Chisom Eze' },
        artisan: { id: 'art-1', user: { id: 'a1' } },
      })
      review.findUnique.mockResolvedValue(null)
      prisma.$transaction = jest.fn(async (fn: any) => fn({
        review: { create: jest.fn().mockResolvedValue({ id: 'r1', rating: 5 }) },
        artisanProfile: { findUnique: jest.fn().mockResolvedValue({ avgRating: 4, totalReviews: 2 }), update: jest.fn() },
      }))

      await service.createReview('c1', 'b1', 5, 'Great work!')

      expect(notificationsService.create).toHaveBeenCalledWith('a1', {
        type: 'REVIEW_RECEIVED',
        title: 'New review',
        body: expect.any(String),
        link: '/artisans/art-1',
      })
    })

    it('uploads a review photo and stores its URL on the review', async () => {
      booking.findUnique.mockResolvedValue({
        ...baseBooking,
        status: 'COMPLETED',
        customer: { id: 'c1', name: 'Chisom Eze' },
        artisan: { id: 'art-1', user: { id: 'a1' } },
      })
      review.findUnique.mockResolvedValue(null)
      uploadService.uploadReviewPhoto.mockResolvedValue('https://cloudinary.com/review.jpg')
      const create = jest.fn().mockResolvedValue({ id: 'r1', rating: 5, photoUrl: 'https://cloudinary.com/review.jpg' })
      prisma.$transaction = jest.fn(async (fn: any) => fn({
        review: { create },
        artisanProfile: { findUnique: jest.fn().mockResolvedValue({ avgRating: 4, totalReviews: 2 }), update: jest.fn() },
      }))

      await service.createReview('c1', 'b1', 5, 'Great work!', 'data:image/jpeg;base64,xxx')

      expect(uploadService.uploadReviewPhoto).toHaveBeenCalledWith('data:image/jpeg;base64,xxx')
      expect(create).toHaveBeenCalledWith({
        data: {
          bookingId: 'b1',
          customerId: 'c1',
          artisanId: 'art-1',
          rating: 5,
          comment: 'Great work!',
          photoUrl: 'https://cloudinary.com/review.jpg',
        },
      })
    })
  })

  describe('raiseDispute', () => {
    it('rejects a dispute from a non-owner', async () => {
      booking.findUnique.mockResolvedValue({ id: 'b1', customerId: 'c1' })
      await expect(service.raiseDispute('c9', 'b1', 'This is a valid reason')).rejects.toThrow(
        'You cannot dispute this booking',
      )
    })

    it('rejects a second open dispute for the same booking', async () => {
      booking.findUnique.mockResolvedValue({ id: 'b1', customerId: 'c1' })
      dispute.findFirst.mockResolvedValue({ id: 'd1', status: 'OPEN' })
      await expect(service.raiseDispute('c1', 'b1', 'This is a valid reason')).rejects.toThrow('already open')
    })

    it('creates a dispute for the owner when none is open', async () => {
      booking.findUnique.mockResolvedValue({ id: 'b1', customerId: 'c1' })
      dispute.findFirst.mockResolvedValue(null)
      dispute.create.mockResolvedValue({ id: 'd1', bookingId: 'b1', raisedBy: 'c1' })
      await expect(service.raiseDispute('c1', 'b1', 'This is a valid reason')).resolves.toEqual({
        id: 'd1',
        bookingId: 'b1',
        raisedBy: 'c1',
      })
    })
  })
})
