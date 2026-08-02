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

export function futureDate() {
  return new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
}
