import request from 'supertest'
import { setupApp, loginReq } from './helpers'

describe('Admin (e2e)', () => {
  const createdIds: string[] = []
  let app: any
  let prisma: any
  let server: any

  let adminToken: string
  let customerToken: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    const admin = await loginReq(server, 'admin@naijahandy.com', 'password123')
    adminToken = admin.body.accessToken
    const customer = await loginReq(server, 'chisom@example.com', 'password123')
    customerToken = customer.body.accessToken
  })

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: createdIds } } })
    await prisma.artisanProfile.deleteMany({ where: { userId: { in: createdIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } })
    await app.close()
  })

  it('blocks non-admins from admin endpoints', async () => {
    const res = await request(server).get('/api/admin/stats').set('Authorization', `Bearer ${customerToken}`)
    expect(res.status).toBe(403)
  })

  it('blocks unauthenticated requests to admin endpoints', async () => {
    const res = await request(server).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })

  it('returns stats for an admin', async () => {
    const res = await request(server).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('revenue')
    expect(res.body.data).toHaveProperty('totalUsers')
    expect(res.body.data).toHaveProperty('totalBookings')
    expect(res.body.data).toHaveProperty('openDisputes')
  })

  it('lists users for an admin', async () => {
    const res = await request(server).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.data)).toBe(true)
    expect(res.body.data).toHaveProperty('total')
  })

  it('lists payments for an admin', async () => {
    const res = await request(server).get('/api/admin/payments').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('suspends a customer, locks them out, then reactivates', async () => {
    const email = `test.admin.${Date.now()}@example.com`
    const reg = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Suspend Me', email, password: 'password123', role: 'CUSTOMER' })
    expect(reg.status).toBe(201)
    const userId = reg.body.user.id
    createdIds.push(userId)

    const suspend = await request(server)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' })
    expect(suspend.status).toBe(200)
    expect(suspend.body.data.status).toBe('SUSPENDED')

    const me = await request(server).get('/api/users/me').set('Authorization', `Bearer ${reg.body.accessToken}`)
    expect(me.status).toBe(401)

    const login = await loginReq(server, email, 'password123')
    expect(login.status).toBe(401)

    const reactivate = await request(server)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' })
    expect(reactivate.status).toBe(200)

    const login2 = await loginReq(server, email, 'password123')
    expect(login2.status).toBe(201)
  })

  it('cannot suspend an admin account', async () => {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@naijahandy.com' } })
    const res = await request(server)
      .patch(`/api/admin/users/${adminUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid user status values', async () => {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@naijahandy.com' } })
    const res = await request(server)
      .patch(`/api/admin/users/${adminUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'HACKED' })
    expect(res.status).toBe(400)
  })
})
