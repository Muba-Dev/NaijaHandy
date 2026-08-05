import request from 'supertest'
import { setupApp, loginReq } from './helpers'

describe('Change password (e2e)', () => {
  const createdIds: string[] = []
  let app: any
  let prisma: any
  let server: any

  const email = `test.changepass.${Date.now()}@example.com`
  const password = 'password123'

  let userId: string
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    ;({ app, prisma, server } = await setupApp())
    const res = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Change Pass Test', email, password, role: 'CUSTOMER' })
    expect(res.status).toBe(201)
    userId = res.body.user.id
    accessToken = res.body.accessToken
    refreshToken = res.body.refreshToken
    createdIds.push(userId)
  })

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: createdIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } })
    await app.close()
  })

  function changePassword(body: any, token: string | null = accessToken) {
    let req = request(server).post('/api/auth/change-password')
    if (token) req = req.set('Authorization', `Bearer ${token}`)
    return req.send(body)
  }

  it('rejects a request without a token', async () => {
    const res = await changePassword({ currentPassword: password, newPassword: 'newpassword456' }, null)
    expect(res.status).toBe(401)
  })

  it('rejects a wrong current password', async () => {
    const res = await changePassword({ currentPassword: 'wrong-password', newPassword: 'newpassword456' })
    expect(res.status).toBe(401)
  })

  it('rejects a new password shorter than 8 characters', async () => {
    const res = await changePassword({ currentPassword: password, newPassword: 'short' })
    expect(res.status).toBe(400)
  })

  it('changes the password and revokes all refresh tokens', async () => {
    const res = await changePassword({ currentPassword: password, newPassword: 'newpassword456' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })

    const oldRefresh = await request(server).post('/api/auth/refresh').send({ refreshToken })
    expect(oldRefresh.status).toBe(401)
  })

  it('logs in with the new password', async () => {
    const res = await loginReq(server, email, 'newpassword456')
    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
  })
})
