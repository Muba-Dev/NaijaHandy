import { PaymentService } from '../../src/payment/payment.service'
import { UnauthorizedException } from '@nestjs/common'
import { createHmac } from 'crypto'

describe('PaymentService', () => {
  const findFirst = jest.fn()
  const paymentUpdate = jest.fn()
  const bookingUpdate = jest.fn()
  const bookingFindUnique = jest.fn()
  const prisma = {
    payment: { findFirst, update: paymentUpdate },
    booking: { update: bookingUpdate, findUnique: bookingFindUnique },
  } as any
  const notificationsService = { create: jest.fn() } as any
  const creditsService = { use: jest.fn() } as any
  const service = new PaymentService(prisma, notificationsService, creditsService)

  const event = {
    event: 'charge.success',
    data: { status: 'success', amount: 2_500_000, metadata: { bookingId: 'b1' } },
  }
  const body = Buffer.from(JSON.stringify(event))

  afterEach(() => {
    delete process.env.PAYSTACK_MOCK
    delete process.env.PAYSTACK_SECRET_KEY
    jest.clearAllMocks()
  })

  describe('webhook signature validation (live mode)', () => {
    beforeEach(() => {
      process.env.PAYSTACK_MOCK = 'false'
      process.env.PAYSTACK_SECRET_KEY = 'test-secret-key'
    })

    it('rejects a missing signature', async () => {
      await expect(service.handleWebhook(body, undefined)).rejects.toThrow('Missing signature')
    })

    it('rejects an invalid signature', async () => {
      await expect(service.handleWebhook(body, 'not-a-valid-signature')).rejects.toThrow('Invalid signature')
    })

    it('rejects a tampered payload signed for the original body', async () => {
      const sig = createHmac('sha512', 'test-secret-key').update(body).digest('hex')
      const tampered = Buffer.from(body.toString().replace('2500000', '5000000'))
      await expect(service.handleWebhook(tampered, sig)).rejects.toThrow('Invalid signature')
    })

    it('accepts a correct signature and finalizes the payment', async () => {
      findFirst.mockResolvedValue({ id: 'p1', bookingId: 'b1', status: 'PENDING', amount: 25000 })
      paymentUpdate.mockResolvedValue({ id: 'p1', status: 'SUCCESS', reference: 'pay_x', amount: 25000, grossAmount: 25000, creditsApplied: 0 })
      bookingUpdate.mockResolvedValue({ id: 'b1', paymentStatus: 'PAID' })
      bookingFindUnique.mockResolvedValue({ id: 'b1', artisan: { userId: 'a1' } })
      const sig = createHmac('sha512', 'test-secret-key').update(body).digest('hex')
      await expect(service.handleWebhook(body, sig)).resolves.toMatchObject({ status: 'SUCCESS' })
      expect(paymentUpdate).toHaveBeenCalledWith({
        where: { bookingId: 'b1' },
        data: expect.objectContaining({ status: 'SUCCESS' }),
      })
      expect(notificationsService.create).toHaveBeenCalledWith('a1', {
        type: 'PAYMENT_RECEIVED',
        title: 'Payment received',
        body: expect.any(String),
        link: '/dashboard/artisan/requests',
      })
    })
  })

  describe('finalization (mock mode)', () => {
    beforeEach(() => {
      process.env.PAYSTACK_MOCK = 'true'
    })

    it('debits applied credits once when the payment succeeds', async () => {
      findFirst.mockResolvedValue({
        id: 'p1', bookingId: 'b1', status: 'PENDING', amount: 20000, grossAmount: 25000, creditsApplied: 5000,
      })
      paymentUpdate.mockResolvedValue({
        id: 'p1', status: 'SUCCESS', reference: 'pay_x', amount: 20000, grossAmount: 25000, creditsApplied: 5000,
      })
      bookingUpdate.mockResolvedValue({ id: 'b1', paymentStatus: 'PAID' })
      bookingFindUnique
        .mockResolvedValueOnce({ id: 'b1', customerId: 'c1' }) // credit debit lookup
        .mockResolvedValueOnce({ id: 'b1', artisan: { userId: 'a1' } }) // notification lookup
      creditsService.use.mockResolvedValue([{}, {}])
      const chargedBody = Buffer.from(
        JSON.stringify({ event: 'charge.success', data: { status: 'success', amount: 2_000_000, metadata: { bookingId: 'b1' } } }),
      )

      await expect(service.handleWebhook(chargedBody, undefined)).resolves.toMatchObject({ status: 'SUCCESS' })
      expect(creditsService.use).toHaveBeenCalledWith('c1', 5000, 'b1', expect.any(String))
    })

    it('does not debit credits when none were applied', async () => {
      findFirst.mockResolvedValue({ id: 'p1', bookingId: 'b1', status: 'PENDING', amount: 25000, creditsApplied: 0 })
      paymentUpdate.mockResolvedValue({
        id: 'p1', status: 'SUCCESS', reference: 'pay_x', amount: 25000, grossAmount: 25000, creditsApplied: 0,
      })
      bookingUpdate.mockResolvedValue({ id: 'b1', paymentStatus: 'PAID' })
      bookingFindUnique.mockResolvedValue({ id: 'b1', artisan: { userId: 'a1' } })

      await expect(service.handleWebhook(body, undefined)).resolves.toMatchObject({ status: 'SUCCESS' })
      expect(creditsService.use).not.toHaveBeenCalled()
    })

    it('returns duplicate when the payment is already SUCCESS', async () => {
      findFirst.mockResolvedValue({ id: 'p1', bookingId: 'b1', status: 'SUCCESS', amount: 25000 })
      await expect(service.handleWebhook(body, undefined)).resolves.toEqual({ received: true, duplicate: true })
      expect(paymentUpdate).not.toHaveBeenCalled()
    })

    it('marks the payment FAILED on an amount mismatch', async () => {
      findFirst.mockResolvedValue({ id: 'p1', bookingId: 'b1', status: 'PENDING', amount: 25000 })
      const wrongAmount = Buffer.from(JSON.stringify({ ...event, data: { ...event.data, amount: 100 } }))
      paymentUpdate.mockResolvedValue({ id: 'p1', status: 'FAILED' })
      await expect(service.handleWebhook(wrongAmount, undefined)).resolves.toEqual({ id: 'p1', status: 'FAILED' })
    })

    it('ignores non-charge.success events', async () => {
      const other = Buffer.from(JSON.stringify({ event: 'transfer.success', data: {} }))
      await expect(service.handleWebhook(other, undefined)).resolves.toEqual({
        received: true,
        event: 'transfer.success',
      })
    })

    it('ignores success events without a bookingId', async () => {
      const noBooking = Buffer.from(JSON.stringify({ event: 'charge.success', data: { status: 'success' } }))
      await expect(service.handleWebhook(noBooking, undefined)).resolves.toEqual({
        received: true,
        ignored: 'no bookingId',
      })
    })
  })

  describe('initialize with credits (mock mode)', () => {
    beforeEach(() => {
      process.env.PAYSTACK_MOCK = 'true'
      prisma.payment.upsert = jest.fn()
    })

    const bookable = (creditBalance: number) => ({
      id: 'b1', customerId: 'c1', amount: 25000, paymentStatus: 'UNPAID', payment: null,
      customer: { email: 'c@example.com', creditBalance },
    })

    it('charges gross minus credits and stores the split', async () => {
      bookingFindUnique.mockResolvedValue(bookable(3000))
      prisma.payment.upsert.mockResolvedValue({ id: 'p1', reference: 'pay_x', amount: 22000, grossAmount: 25000, creditsApplied: 3000 })

      await service.initialize('c1', 'b1', 3000)

      expect(prisma.payment.upsert).toHaveBeenCalledWith({
        where: { bookingId: 'b1' },
        update: expect.objectContaining({ amount: 22000, grossAmount: 25000, creditsApplied: 3000 }),
        create: expect.objectContaining({ amount: 22000, grossAmount: 25000, creditsApplied: 3000 }),
      })
    })

    it('rejects credits that exceed the balance', async () => {
      bookingFindUnique.mockResolvedValue(bookable(500))
      await expect(service.initialize('c1', 'b1', 3000)).rejects.toThrow('Insufficient credit balance')
      expect(prisma.payment.upsert).not.toHaveBeenCalled()
    })

    it('caps credits at the booking amount', async () => {
      bookingFindUnique.mockResolvedValue(bookable(50000))
      prisma.payment.upsert.mockResolvedValue({ id: 'p1', reference: 'pay_x', amount: 0, grossAmount: 25000, creditsApplied: 25000 })

      await service.initialize('c1', 'b1', 100000)

      expect(prisma.payment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ amount: 0, grossAmount: 25000, creditsApplied: 25000 }),
        }),
      )
    })
  })
})
