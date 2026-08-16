import request from 'supertest'
import { setupApp, loginReq, registerVerified } from './helpers'

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
    const reg = await registerVerified(server, { name: 'Suspend Me', email, password: 'password123', role: 'CUSTOMER' })
    const userId = reg.user.id
    createdIds.push(userId)

    const suspend = await request(server)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' })
    expect(suspend.status).toBe(200)
    expect(suspend.body.data.status).toBe('SUSPENDED')

    const me = await request(server).get('/api/users/me').set('Authorization', `Bearer ${reg.accessToken}`)
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

  it('deletes a customer, anonymizes their data, and locks them out', async () => {
    const email = `test.del.${Date.now()}@example.com`
    const reg = await registerVerified(server, { name: 'Delete Me', email, password: 'password123', role: 'CUSTOMER' })
    const userId = reg.user.id
    createdIds.push(userId)

    const del = await request(server)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(del.status).toBe(200)
    expect(del.body.data.status).toBe('DELETED')

    const row = await prisma.user.findUnique({ where: { id: userId } })
    expect(row.status).toBe('DELETED')
    expect(row.name).toBe('Deleted User')
    expect(row.phone).toBeNull()
    expect(row.password).toBeNull()
    expect(row.email).toMatch(/^deleted-.*@naijahandy\.local$/)

    const me = await request(server).get('/api/users/me').set('Authorization', `Bearer ${reg.accessToken}`)
    expect(me.status).toBe(401)

    const login = await loginReq(server, email, 'password123')
    expect(login.status).toBe(401)
  })

  it('cannot delete an admin account', async () => {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@naijahandy.com' } })
    const res = await request(server)
      .delete(`/api/admin/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })

  it('cannot delete your own account', async () => {
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@naijahandy.com' } })
    const res = await request(server)
      .delete(`/api/admin/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })

  it('deleting an artisan takes them offline and hides them from the public listing', async () => {
    const email = `test.art.del.${Date.now()}@example.com`
    const reg = await registerVerified(server, { name: 'Doomed Artisan', email, password: 'password123', role: 'ARTISAN', profession: 'Kettle Repair', category: 'Home Repairs', city: 'Lagos' })
    const userId = reg.user.id
    createdIds.push(userId)

    const me = await request(server).get('/api/artisans/me').set('Authorization', `Bearer ${reg.accessToken}`)
    expect(me.status).toBe(200)
    const profileId = me.body.data.id

    const approved = await request(server)
      .patch(`/api/admin/artisans/${profileId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvalStatus: 'APPROVED' })
    expect(approved.status).toBe(200)

    const before = await request(server).get('/api/artisans').query({ q: 'Kettle Repair' })
    expect(before.status).toBe(200)
    expect(before.body.data.some((a: any) => a.id === profileId)).toBe(true)

    const del = await request(server)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(del.status).toBe(200)

    const profile = await prisma.artisanProfile.findUnique({ where: { userId } })
    expect(profile.available).toBe(false)

    const after = await request(server).get('/api/artisans').query({ q: 'Kettle Repair' })
    expect(after.status).toBe(200)
    expect(after.body.data.some((a: any) => a.id === profileId)).toBe(false)
  })
})
