import { BookingService } from '../../src/booking/booking.service'
import { ForbiddenException, NotFoundException } from '@nestjs/common'

describe('BookingService', () => {
  const booking = { findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn(), create: jest.fn() }
  const dispute = { findFirst: jest.fn(), create: jest.fn() }
  const prisma = { booking, dispute } as any
  const emailService = { sendBookingStatusEmail: jest.fn() } as any
  const service = new BookingService(prisma, emailService)

  const baseBooking = {
    id: 'b1',
    customerId: 'c1',
    paymentStatus: 'UNPAID',
    status: 'PENDING',
    date: new Date('2026-08-20T09:00:00.000Z'),
    time: '9:00 AM',
    amount: 17000,
    customer: { name: 'Chisom Eze', email: 'chisom@example.com' },
    artisan: { userId: 'a1', user: { name: 'Emeka Okafor', email: 'emeka@example.com' } },
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
