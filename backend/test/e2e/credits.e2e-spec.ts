import request from 'supertest'
import { setupApp, loginReq, futureDate } from './helpers'

describe('Credits (e2e)', () => {
  const createdBookings: string[] = []
  let app: any
  let prisma: any
  let server: any

  let customerToken: string
  let artisanToken: string
  let artisanProfileId: string
  let customerId: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    process.env.PAYSTACK_MOCK = 'true'
    const customer = await loginReq(server, 'chisom@example.com', 'password123')
    customerToken = customer.body.accessToken
    customerId = customer.body.user.id
    const artisan = await loginReq(server, 'emeka@example.com', 'password123')
    artisanToken = artisan.body.accessToken
    const profile = await prisma.artisanProfile.findUnique({ where: { userId: artisan.body.user.id } })
    artisanProfileId = profile.id

    // Reset the seeded customer's wallet to a known state for this suite.
    await prisma.creditTransaction.deleteMany({ where: { userId: customerId } })
    await prisma.user.update({ where: { id: customerId }, data: { creditBalance: 5000 } })
  })

  afterAll(async () => {
    if (createdBookings.length) {
      await prisma.payment.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.booking.deleteMany({ where: { id: { in: createdBookings } } })
    }
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
        time: '09:00',
        description: 'Reward credits e2e booking',
        amount,
      })
    expect(res.status).toBe(201)
    const id = res.body.data.id
    createdBookings.push(id)
    return id
  }

  it('applies credits to the charge, debits the wallet, and awards credits on completion', async () => {
    const id = await createBooking(25000)
    const init = await request(server)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: id, creditsToApply: 2000 })
    expect(init.status).toBe(201)
    const reference = init.body.data.reference

    const payment = await prisma.payment.findUnique({ where: { reference } })
    expect(payment.amount).toBe(23000)
    expect(payment.grossAmount).toBe(25000)
    expect(payment.creditsApplied).toBe(2000)

    const verify = await request(server)
      .get(`/api/payments/verify/${reference}`)
      .set('Authorization', `Bearer ${customerToken}`)
    expect(verify.status).toBe(200)
    expect(verify.body.data.status).toBe('SUCCESS')

    let user = await prisma.user.findUnique({ where: { id: customerId } })
    expect(user.creditBalance).toBe(3000)
    const debit = await prisma.creditTransaction.findFirst({ where: { userId: customerId, type: 'USED' } })
    expect(debit.amount).toBe(-2000)
    expect(debit.balanceAfter).toBe(3000)

    // Complete the booking → 5% of the gross is rewarded back.
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

    user = await prisma.user.findUnique({ where: { id: customerId } })
    expect(user.creditBalance).toBe(4250)
    const earned = await prisma.creditTransaction.findFirst({ where: { userId: customerId, type: 'EARNED', bookingId: id } })
    expect(earned.amount).toBe(1250)
    expect(earned.balanceAfter).toBe(4250)

    const wallet = await request(server).get('/api/credits').set('Authorization', `Bearer ${customerToken}`)
    expect(wallet.status).toBe(200)
    expect(wallet.body.data.balance).toBe(4250)
    expect(wallet.body.data.transactions.length).toBeGreaterThanOrEqual(2)
  })

  it('rejects credits that exceed the balance', async () => {
    const id = await createBooking(10000)
    const res = await request(server)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: id, creditsToApply: 500000 })
    expect(res.status).toBe(400)
  })

  it('blocks unauthenticated wallet access', async () => {
    const res = await request(server).get('/api/credits')
    expect(res.status).toBe(401)
  })
})
