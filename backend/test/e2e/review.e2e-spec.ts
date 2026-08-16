import request from 'supertest'
import { setupApp, loginReq, futureDate, registerVerified } from './helpers'

describe('Booking review (e2e)', () => {
  const createdBookings: string[] = []
  const createdUserIds: string[] = []
  let app: any
  let prisma: any
  let server: any

  let customerToken: string
  let otherCustomerToken: string
  let artisanToken: string
  let artisanProfileId: string
  let artisanUserId: string
  let originalAvgRating: number
  let originalTotalReviews: number

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    const customer = await loginReq(server, 'chisom@example.com', 'password123')
    customerToken = customer.body.accessToken
    const artisan = await loginReq(server, 'emeka@example.com', 'password123')
    artisanToken = artisan.body.accessToken
    artisanUserId = artisan.body.user.id
    const profile = await prisma.artisanProfile.findUnique({ where: { userId: artisanUserId } })
    artisanProfileId = profile.id
    originalAvgRating = profile.avgRating
    originalTotalReviews = profile.totalReviews

    const other = await registerVerified(server, {
      name: 'Other Reviewer',
      email: `test.reviewer.${Date.now()}@example.com`,
      password: 'password123',
      role: 'CUSTOMER',
    })
    otherCustomerToken = other.accessToken
    createdUserIds.push(other.user.id)
  })

  afterAll(async () => {
    await prisma.artisanProfile.update({
      where: { id: artisanProfileId },
      data: { avgRating: originalAvgRating, totalReviews: originalTotalReviews },
    })
    if (createdBookings.length) {
      await prisma.review.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.dispute.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.payment.deleteMany({ where: { bookingId: { in: createdBookings } } })
      await prisma.booking.deleteMany({ where: { id: { in: createdBookings } } })
    }
    if (createdUserIds.length) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    }
    await app.close()
  })

  async function createBooking(status: 'PENDING' | 'COMPLETED' = 'PENDING') {
    const res = await request(server)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        artisanId: artisanProfileId,
        date: futureDate(),
        time: '11:00',
        description: 'Fix a broken tiling on the kitchen floor',
        amount: 30000,
      })
    expect(res.status).toBe(201)
    const id = res.body.data.id
    createdBookings.push(id)
    if (status !== 'PENDING') {
      await prisma.booking.update({ where: { id }, data: { status } })
    }
    return id
  }

  function submitReview(bookingId: string, body: any, token: string) {
    return request(server)
      .post(`/api/bookings/${bookingId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
  }

  it('rejects a review without a token', async () => {
    const id = await createBooking('COMPLETED')
    const res = await request(server).post(`/api/bookings/${id}/review`).send({ rating: 5, comment: 'Great work' })
    expect(res.status).toBe(401)
  })

  it('blocks the artisan from reviewing the booking', async () => {
    const id = await createBooking('COMPLETED')
    const res = await submitReview(id, { rating: 5, comment: 'Great work' }, artisanToken)
    expect(res.status).toBe(403)
  })

  it('blocks a non-owner customer from reviewing', async () => {
    const id = await createBooking('COMPLETED')
    const res = await submitReview(id, { rating: 5, comment: 'Great work' }, otherCustomerToken)
    expect(res.status).toBe(403)
  })

  it('blocks reviewing a booking that is not COMPLETED', async () => {
    const id = await createBooking('PENDING')
    const res = await submitReview(id, { rating: 5, comment: 'Great work' }, customerToken)
    expect(res.status).toBe(403)
  })

  it('rejects an out-of-range rating', async () => {
    const id = await createBooking('COMPLETED')
    const res = await submitReview(id, { rating: 6, comment: 'Great work' }, customerToken)
    expect(res.status).toBe(400)
  })

  it('rejects a too-short comment', async () => {
    const id = await createBooking('COMPLETED')
    const res = await submitReview(id, { rating: 5, comment: 'ok' }, customerToken)
    expect(res.status).toBe(400)
  })

  it('creates a review and updates the artisan rating', async () => {
    const id = await createBooking('COMPLETED')
    const res = await submitReview(id, { rating: 5, comment: 'Excellent craftsmanship' }, customerToken)
    expect(res.status).toBe(201)
    expect(res.body.data.bookingId).toBe(id)
    expect(res.body.data.rating).toBe(5)

    const after = await prisma.artisanProfile.findUnique({ where: { id: artisanProfileId } })
    expect(after.totalReviews).toBe(originalTotalReviews + 1)
    expect(after.avgRating).toBe(Math.round(((originalAvgRating * originalTotalReviews + 5) / (originalTotalReviews + 1)) * 100) / 100)
  })

  it('blocks a duplicate review for the same booking', async () => {
    const id = await createBooking('COMPLETED')
    await submitReview(id, { rating: 4, comment: 'Solid work overall' }, customerToken)
    const res = await submitReview(id, { rating: 3, comment: 'Second attempt' }, customerToken)
    expect(res.status).toBe(403)
  })
})
