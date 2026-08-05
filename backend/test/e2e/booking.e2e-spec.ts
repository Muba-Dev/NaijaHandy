import request from 'supertest'
import { setupApp, loginReq, futureDate } from './helpers'

describe('Booking (e2e)', () => {
  const createdBookings: string[] = []
  let app: any
  let prisma: any
  let server: any

  let customerToken: string
  let artisanToken: string
  let artisanProfileId: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    const customer = await loginReq(server, 'chisom@example.com', 'password123')
    customerToken = customer.body.accessToken
    const artisan = await loginReq(server, 'emeka@example.com', 'password123')
    artisanToken = artisan.body.accessToken
    const profile = await prisma.artisanProfile.findUnique({ where: { userId: artisan.body.user.id } })
    artisanProfileId = profile.id
  })

  afterAll(async () => {
    if (createdBookings.length) {
      await prisma.dispute.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.booking.deleteMany({ where: { id: { in: createdBookings } } })
    }
    await app.close()
  })

  function createBooking(description = 'Fix a leaking kitchen sink and pipes') {
    return request(server)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        artisanId: artisanProfileId,
        date: futureDate(),
        time: '10:00',
        description,
        amount: 25000,
      })
  }

  it('rejects booking creation without a token', async () => {
    const res = await request(server).post('/api/bookings').send({
      artisanId: artisanProfileId,
      date: futureDate(),
      time: '10:00',
      description: 'Fix a leaking kitchen sink and pipes',
      amount: 25000,
    })
    expect(res.status).toBe(401)
  })

  it('rejects booking creation with a short description', async () => {
    const res = await createBooking('Too short')
    expect(res.status).toBe(400)
  })

  it('creates a booking as a customer', async () => {
    const res = await createBooking()
    expect(res.status).toBe(201)
    expect(res.body.data.customerId).toBeTruthy()
    createdBookings.push(res.body.data.id)
  })

  it('blocks the artisan from confirming an UNPAID booking', async () => {
    const res = await request(server)
      .patch(`/api/bookings/${createdBookings[0]}/status`)
      .set('Authorization', `Bearer ${artisanToken}`)
      .send({ status: 'CONFIRMED' })
    expect(res.status).toBe(403)
  })

  it('blocks a non-owner from updating the booking', async () => {
    const res = await request(server)
      .patch(`/api/bookings/${createdBookings[0]}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'CONFIRMED' })
    expect(res.status).toBe(403)
  })

  it('blocks an invalid status value', async () => {
    const res = await request(server)
      .patch(`/api/bookings/${createdBookings[0]}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'HACKED' })
    expect(res.status).toBe(400)
  })

  it('lets the customer cancel their own PENDING booking', async () => {
    const res = await request(server)
      .patch(`/api/bookings/${createdBookings[0]}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'CANCELLED' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('CANCELLED')
  })

  it('blocks a transition out of a terminal state', async () => {
    const res = await request(server)
      .patch(`/api/bookings/${createdBookings[0]}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'PENDING' })
    expect(res.status).toBe(403)
  })

  it('lists the customers own bookings', async () => {
    const res = await request(server).get('/api/bookings').set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(200)
    for (const b of res.body.data) {
      expect(b.customer).toBeTruthy()
      expect(b.payment).toBeDefined()
    }
  })

  it('raises a dispute for the booking', async () => {
    const res = await request(server)
      .post(`/api/bookings/${createdBookings[0]}/dispute`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Artisan never showed up for the job' })
    expect(res.status).toBe(201)
  })

  it('blocks a second open dispute for the same booking', async () => {
    const res = await request(server)
      .post(`/api/bookings/${createdBookings[0]}/dispute`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Second complaint about the job' })
    expect(res.status).toBe(403)
  })
})
