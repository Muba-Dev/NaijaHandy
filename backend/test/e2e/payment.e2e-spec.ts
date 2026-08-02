import request from 'supertest'
import { setupApp, loginReq, futureDate } from './helpers'

describe('Payment (e2e)', () => {
  const createdBookings: string[] = []
  let app: any
  let prisma: any
  let server: any

  let customerToken: string
  let artisanToken: string
  let artisanProfileId: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    process.env.PAYSTACK_MOCK = 'true'
    const customer = await loginReq(server, 'chisom@example.com', 'password123')
    customerToken = customer.body.accessToken
    const artisan = await loginReq(server, 'emeka@example.com', 'password123')
    artisanToken = artisan.body.accessToken
    const profile = await prisma.artisanProfile.findUnique({ where: { userId: artisan.body.user.id } })
    artisanProfileId = profile.id
  })

  afterAll(async () => {
    if (createdBookings.length) {
      await prisma.payment.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.dispute.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.booking.deleteMany({ where: { id: { in: createdBookings } } })
    }
    await app.close()
  })

  async function createBooking(amount = 25000) {
    const res = await request(server)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        artisanId: artisanProfileId,
        date: futureDate(),
        time: '09:00',
        description: 'Install a new bathroom faucet and seal the pipes',
        amount,
      })
    expect(res.status).toBe(201)
    const id = res.body.data.id
    createdBookings.push(id)
    return id
  }

  function initialize(bookingId: string, token = customerToken) {
    return request(server)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId })
  }

  function webhook(payload: any) {
    return request(server).post('/api/payments/webhook').set('Content-Type', 'application/json').send(payload)
  }

  it('blocks initialization by a non-owner', async () => {
    const id = await createBooking()
    const res = await initialize(id, artisanToken)
    expect(res.status).toBe(403)
  })

  it('blocks initialization without an auth token', async () => {
    const id = await createBooking()
    const res = await request(server).post('/api/payments/initialize').send({ bookingId: id })
    expect(res.status).toBe(401)
  })

  it('initializes a payment in mock mode', async () => {
    const id = await createBooking(25000)
    const res = await initialize(id)
    expect(res.status).toBe(201)
    expect(res.body.data.reference).toMatch(/^pay_/)
    expect(res.body.data.authorization_url).toContain('reference=')
  })

  let paidBookingId: string
  let paidBookingReference: string

  it('verifies the payment and marks the booking PAID', async () => {
    paidBookingId = await createBooking(25000)
    const init = await initialize(paidBookingId)
    paidBookingReference = init.body.data.reference

    const res = await request(server)
      .get(`/api/payments/verify/${paidBookingReference}`)
      .set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('SUCCESS')

    const booking = await prisma.booking.findUnique({ where: { id: paidBookingId } })
    expect(booking.paymentStatus).toBe('PAID')
    expect(booking.paymentReference).toBe(paidBookingReference)
  })

  it('rejects re-initialization once paid', async () => {
    const res = await initialize(paidBookingId)
    expect(res.status).toBe(400)
  })

  it('lets a stranger or artisan not verify the payment', async () => {
    const res = await request(server)
      .get(`/api/payments/verify/${paidBookingReference}`)
      .set('Authorization', `Bearer ${artisanToken}`)
    expect(res.status).toBe(403)
  })

  it('allows the artisan to confirm the paid booking', async () => {
    const res = await request(server)
      .patch(`/api/bookings/${paidBookingId}/status`)
      .set('Authorization', `Bearer ${artisanToken}`)
      .send({ status: 'CONFIRMED' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('CONFIRMED')
  })

  it('returns duplicate for a replayed webhook after finalization', async () => {
    const payload = {
      event: 'charge.success',
      data: { status: 'success', amount: 2_500_000, metadata: { bookingId: paidBookingId } },
    }
    const res = await webhook(payload)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ received: true, duplicate: true })
  })

  it('marks a payment FAILED when the webhook amount mismatches', async () => {
    const id = await createBooking(30000)
    const init = await initialize(id)
    const reference = init.body.data.reference

    const res = await webhook({
      event: 'charge.success',
      data: { status: 'success', amount: 100, metadata: { bookingId: id } },
    })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('FAILED')

    const payment = await prisma.payment.findUnique({ where: { reference } })
    expect(payment.status).toBe('FAILED')

    const booking = await prisma.booking.findUnique({ where: { id } })
    expect(booking.paymentStatus).toBe('UNPAID')
  })
})
