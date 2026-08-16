import { Test } from '@nestjs/testing'
import * as dotenv from 'dotenv'
import request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'

dotenv.config()

export async function setupApp() {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleFixture.createNestApplication({ rawBody: true })
  await app.init()
  const prisma = moduleFixture.get(PrismaService)
  return { app, prisma, server: app.getHttpServer() }
}

export function loginReq(server: any, email: string, password: string) {
  return request(server).post('/api/auth/login').send({ email, password })
}

// Registers a user, completes email verification with the dev OTP, and returns
// their tokens + verified user. EMAIL_ENABLED is not set in CI, so the OTP is
// returned as `devCode` by the API.
export async function registerVerified(
  server: any,
  payload: {
    name: string
    email: string
    password: string
    role: 'CUSTOMER' | 'ARTISAN'
    profession?: string
    category?: string
    city?: string
  },
) {
  const reg = await request(server).post('/api/auth/register').send(payload)
  if (reg.status !== 201) throw new Error(`register failed: ${JSON.stringify(reg.body)}`)
  const { user } = reg.body

  const reqCode = await request(server).post('/api/auth/verify-email/request').send({ email: user.email })
  if (reqCode.status !== 200) throw new Error(`verify-email/request failed: ${JSON.stringify(reqCode.body)}`)
  if (!reqCode.body.devCode) throw new Error('verify-email/request did not return a devCode')

  const confirm = await request(server).post('/api/auth/verify-email/confirm').send({ email: user.email, code: reqCode.body.devCode })
  if (confirm.status !== 201) throw new Error(`verify-email/confirm failed: ${JSON.stringify(confirm.body)}`)

  return { user: confirm.body.user, accessToken: confirm.body.accessToken, refreshToken: confirm.body.refreshToken }
}

export function futureDate() {
  return new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
}
