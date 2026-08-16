import request from 'supertest'
import { setupApp, loginReq, registerVerified } from './helpers'

describe('Demo artisans (e2e)', () => {
  let app: any
  let prisma: any
  let server: any
  const createdEmails: string[] = []

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } })
    await app.close()
  })

  it('shows demo artisans to anonymous visitors', async () => {
    const res = await request(server).get('/api/artisans')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data.some((a: any) => a.isDemo)).toBe(true)
  })

  it('shows demo artisan detail to anonymous visitors', async () => {
    const list = await request(server).get('/api/artisans')
    const demo = list.body.data.find((a: any) => a.isDemo)
    expect(demo).toBeTruthy()
    const res = await request(server).get(`/api/artisans/${demo.id}`)
    expect(res.status).toBe(200)
  })

  it('hides demo artisans from a logged-in non-demo customer', async () => {
    const email = `demo.filter.${Date.now()}@example.com`
    createdEmails.push(email)
    const user = await registerVerified(server, { name: 'Demo Filter', email, password: 'password123', role: 'CUSTOMER' })
    const res = await request(server)
      .get('/api/artisans')
      .set('Authorization', `Bearer ${user.accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.some((a: any) => a.isDemo)).toBe(false)
  })

  it('returns 404 for a demo artisan detail to a non-demo customer', async () => {
    const list = await request(server).get('/api/artisans')
    const demo = list.body.data.find((a: any) => a.isDemo)
    const email = `demo.detail.${Date.now()}@example.com`
    createdEmails.push(email)
    const user = await registerVerified(server, { name: 'Demo Detail', email, password: 'password123', role: 'CUSTOMER' })
    const res = await request(server)
      .get(`/api/artisans/${demo.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
    expect(res.status).toBe(404)
  })

  it('shows demo artisans to admins', async () => {
    const admin = await loginReq(server, 'admin@naijahandy.com', 'password123')
    const res = await request(server)
      .get('/api/artisans')
      .set('Authorization', `Bearer ${admin.body.accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.some((a: any) => a.isDemo)).toBe(true)
  })

  it('ignores a garbage bearer token and falls back to anonymous', async () => {
    const res = await request(server)
      .get('/api/artisans')
      .set('Authorization', 'Bearer not-a-real-token')
    expect(res.status).toBe(200)
    expect(res.body.data.some((a: any) => a.isDemo)).toBe(true)
  })
})
