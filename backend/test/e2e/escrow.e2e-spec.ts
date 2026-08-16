import request from 'supertest'
import { setupApp, loginReq, futureDate } from './helpers'

describe('Escrow (e2e)', () => {
  const createdBookings: string[] = []
  let app: any
  let prisma: any
  let server: any

  let customerToken: string
  let artisanToken: string
  let adminToken: string
  let artisanProfileId: string
  let artisanUserId: string
  let customerId: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    process.env.PAYSTACK_MOCK = 'true'
    const customer = await loginReq(server, 'chisom@example.com', 'password123')
    customerToken = customer.body.accessToken
    customerId = customer.body.user.id
    const artisan = await loginReq(server, 'emeka@example.com', 'password123')
    artisanToken = artisan.body.accessToken
    artisanUserId = artisan.body.user.id
    const admin = await loginReq(server, 'admin@naijahandy.com', 'password123')
    adminToken = admin.body.accessToken
    const profile = await prisma.artisanProfile.findUnique({ where: { userId: artisanUserId } })
    artisanProfileId = profile.id

    // Reset the seeded customer's wallet to a known state for this suite.
    await prisma.creditTransaction.deleteMany({ where: { userId: customerId } })
    await prisma.user.update({ where: { id: customerId }, data: { creditBalance: 2000 } })
  })

  afterAll(async () => {
    if (createdBookings.length) {
      await prisma.payment.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.dispute.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.booking.deleteMany({ where: { id: { in: createdBookings } } })
    }
    await prisma.notification.deleteMany({
      where: { userId: { in: [customerId, artisanUserId] }, type: { in: ['PAYMENT_RECEIVED', 'PAYMENT_RELEASED', 'PAYMENT_REFUNDED'] } },
    })
    await prisma.creditTransaction.deleteMany({ where: { userId: customerId } })
    await prisma.user.update({ where: { id: customerId }, data: { creditBalance: 0 } })
    await app.close()
  })

  async function createBooking(amount = 25000) {
    const res = await request(server)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        artisanId: artisanProfileId,
        date: futureDate(),
        time: '10:00',
        description: 'Escrow e2e booking',
        amount,
      })
    expect(res.status).toBe(201)
    const id = res.body.data.id
    createdBookings.push(id)
    return id
  }

  async function pay(id: string, creditsToApply = 0) {
    const init = await request(server)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: id, creditsToApply })
    expect(init.status).toBe(201)
    const reference = init.body.data.reference
    const verify = await request(server)
      .get(`/api/payments/verify/${reference}`)
      .set('Authorization', `Bearer ${customerToken}`)
    expect(verify.status).toBe(200)
    expect(verify.body.data.status).toBe('SUCCESS')
    return reference
  }

  it('holds the payment in escrow on success and releases it to the artisan on completion', async () => {
    const id = await createBooking(25000)
    await pay(id)

    let payment = await prisma.payment.findUnique({ where: { bookingId: id } })
    expect(payment.escrowStatus).toBe('HELD')
    expect(payment.escrowHeldAt).not.toBeNull()
    let booking = await prisma.booking.findUnique({ where: { id } })
    expect(booking.paymentStatus).toBe('PAID')
    const heldNotif = await prisma.notification.findFirst({
      where: { userId: artisanUserId, type: 'PAYMENT_RECEIVED' },
      orderBy: { createdAt: 'desc' },
    })
    expect(heldNotif?.body).toContain('held in escrow')

    await request(server)
      .patch(`/api/bookings/${id}/status`)
      .set('Authorization', `Bearer ${artisanToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(200)
    await request(server)
      .patch(`/api/bookings/${id}/status`)
      .set('Authorization', `Bearer ${artisanToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200)

    payment = await prisma.payment.findUnique({ where: { bookingId: id } })
    expect(payment.escrowStatus).toBe('RELEASED')
    expect(payment.escrowReleasedAt).not.toBeNull()
    expect(payment.payoutAmount).toBe(24500) // gross − ₦500 platform fee
    const releasedNotif = await prisma.notification.findFirst({
      where: { userId: artisanUserId, type: 'PAYMENT_RELEASED' },
      orderBy: { createdAt: 'desc' },
    })
    expect(releasedNotif?.body).toContain('24,500')
  })

  it('refunds the escrow on cancellation and restores any applied credits', async () => {
    const id = await createBooking(15000)
    const before = (await prisma.user.findUnique({ where: { id: customerId } })).creditBalance
    await pay(id, 1000)

    let user = await prisma.user.findUnique({ where: { id: customerId } })
    expect(user.creditBalance).toBe(before - 1000)

    await request(server)
      .patch(`/api/bookings/${id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'CANCELLED' })
      .expect(200)

    const payment = await prisma.payment.findUnique({ where: { bookingId: id } })
    expect(payment.escrowStatus).toBe('REFUNDED')
    expect(payment.status).toBe('REFUNDED')
    expect(payment.escrowRefundedAt).not.toBeNull()
    const booking = await prisma.booking.findUnique({ where: { id } })
    expect(booking.paymentStatus).toBe('REFUNDED')

    user = await prisma.user.findUnique({ where: { id: customerId } })
    expect(user.creditBalance).toBe(before)
    const refundTxn = await prisma.creditTransaction.findFirst({
      where: { userId: customerId, bookingId: id, note: { contains: 'Refund' } },
    })
    expect(refundTxn?.amount).toBe(1000)
    const refundNotif = await prisma.notification.findFirst({
      where: { userId: customerId, type: 'PAYMENT_REFUNDED' },
      orderBy: { createdAt: 'desc' },
    })
    expect(refundNotif).not.toBeNull()
  })

  it('refunds a held escrow when an admin upholds (RESOLVES) a dispute', async () => {
    const id = await createBooking(20000)
    await pay(id)

    const dispute = await request(server)
      .post(`/api/bookings/${id}/dispute`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'The job was never done as agreed' })
    expect(dispute.status).toBe(201)
    const disputeId = dispute.body.data.id

    await request(server)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED', resolution: 'Refund the customer' })
      .expect(201)

    const payment = await prisma.payment.findUnique({ where: { bookingId: id } })
    expect(payment.escrowStatus).toBe('REFUNDED')
    expect(payment.status).toBe('REFUNDED')
  })

  it('releases a held escrow when an admin dismisses a dispute', async () => {
    const id = await createBooking(20000)
    await pay(id)

    const dispute = await request(server)
      .post(`/api/bookings/${id}/dispute`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Customer changed their mind mid-job' })
    expect(dispute.status).toBe(201)
    const disputeId = dispute.body.data.id

    await request(server)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DISMISSED', resolution: 'No issue found' })
      .expect(201)

    const payment = await prisma.payment.findUnique({ where: { bookingId: id } })
    expect(payment.escrowStatus).toBe('RELEASED')
    expect(payment.payoutAmount).toBe(19500)
  })
})
