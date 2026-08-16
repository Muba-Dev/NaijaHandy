import request from 'supertest'
import { setupApp, loginReq } from './helpers'

describe('Auth (e2e)', () => {
  const createdIds: string[] = []
  let app: any
  let prisma: any
  let server: any

  const email = `test.auth.${Date.now()}@example.com`
  const password = 'password123'

  let userId: string
  let accessToken: string
  let refreshToken: string
  let devCode: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
  })

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: createdIds } } })
    await prisma.artisanProfile.deleteMany({ where: { userId: { in: createdIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } })
    await app.close()
  })

  it('registers a new customer but does not log them in until verified', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Auth Test', email, password, role: 'CUSTOMER' })
    expect(res.status).toBe(201)
    expect(res.body.verificationRequired).toBe(true)
    expect(res.body.accessToken).toBeUndefined()
    expect(res.body.user.email).toBe(email)
    userId = res.body.user.id
    createdIds.push(userId)
  })

  it('rejects a duplicate email', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Auth Test', email, password, role: 'CUSTOMER' })
    expect(res.status).toBe(400)
  })

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Short Pass', email: `short.${Date.now()}@example.com`, password: 'short', role: 'CUSTOMER' })
    expect(res.status).toBe(400)
  })

  it('blocks login until the email is verified', async () => {
    const res = await loginReq(server, email, password)
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/verify your email/i)
  })

  it('sends a verification code', async () => {
    const res = await request(server)
      .post('/api/auth/verify-email/request')
      .send({ email })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.devCode).toMatch(/^\d{6}$/)
    devCode = res.body.devCode
  })

  it('rejects an incorrect verification code', async () => {
    const res = await request(server)
      .post('/api/auth/verify-email/confirm')
      .send({ email, code: '000000' })
    expect(res.status).toBe(400)
  })

  it('verifies the email and returns tokens', async () => {
    const res = await request(server)
      .post('/api/auth/verify-email/confirm')
      .send({ email, code: devCode })
    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    accessToken = res.body.accessToken
    refreshToken = res.body.refreshToken
  })

  it('logs in with valid credentials once verified', async () => {
    const res = await loginReq(server, email, password)
    expect(res.status).toBe(201)
    accessToken = res.body.accessToken
    refreshToken = res.body.refreshToken
  })

  it('rejects a wrong password', async () => {
    const res = await loginReq(server, email, 'wrong-password')
    expect(res.status).toBe(401)
  })

  it('returns 401 on protected routes without a token', async () => {
    const res = await request(server).get('/api/users/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 on protected routes with a garbage token', async () => {
    const res = await request(server).get('/api/users/me').set('Authorization', 'Bearer garbage.token.here')
    expect(res.status).toBe(401)
  })

  it('GET /api/users/me works with a valid access token', async () => {
    const res = await request(server).get('/api/users/me').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(userId)
    expect(res.body.data.email).toBe(email)
  })

  it('rotates the refresh token and invalidates the old one', async () => {
    const oldToken = refreshToken
    const res = await request(server).post('/api/auth/refresh').send({ refreshToken: oldToken })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(res.body.refreshToken).not.toBe(oldToken)

    const replay = await request(server).post('/api/auth/refresh').send({ refreshToken: oldToken })
    expect(replay.status).toBe(401)

    refreshToken = res.body.refreshToken
    accessToken = res.body.accessToken
  })

  it('revokes the refresh token on logout', async () => {
    const res = await request(server).post('/api/auth/logout').send({ refreshToken })
    expect(res.status).toBe(200)

    const reuse = await request(server).post('/api/auth/refresh').send({ refreshToken })
    expect(reuse.status).toBe(401)
  })

  it('registers an ARTISAN with an artisan profile', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Artisan Test',
        email: `test.artisan.${Date.now()}@example.com`,
        password,
        role: 'ARTISAN',
        profession: 'Electrician',
      })
    expect(res.status).toBe(201)
    createdIds.push(res.body.user.id)
    const profile = await prisma.artisanProfile.findUnique({ where: { userId: res.body.user.id } })
    expect(profile).not.toBeNull()
    expect(profile.profession).toBe('Electrician')
  })
})
