import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { AppModule } from './app.module'
import dotenv from 'dotenv'

dotenv.config()

const rawBodyCapture = (req: any, _res: any, buffer: Buffer) => {
  if (Buffer.isBuffer(buffer)) req.rawBody = buffer
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false })
  app.use(helmet())
  app.set('trust proxy', 1)
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' })
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'))
  }
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'test' ? 1000 : 100,
    }),
  )
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json({ limit: '6mb', verify: rawBodyCapture }))
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NaijaHandy API')
      .setDescription('REST API for the NaijaHandy home services marketplace.')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    })
  }

  // Safety net: ensure all columns exist (migrations may have failed on Render)
  try {
    const { PrismaClient } = await import('@prisma/client')
    const p = new PrismaClient()

    const addCol = async (table: string, col: string, typedef: string) => {
      const exists = await p.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2) AS "exists"`,
        table, col,
      )
      if (!exists[0]?.exists) {
        await p.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${typedef}`)
        console.log(`Startup fix: added "${col}" to "${table}"`)
      }
    }

    // users
    await addCol('users', 'status', `TEXT NOT NULL DEFAULT 'ACTIVE'`)
    await addCol('users', 'googleId', 'TEXT')
    await addCol('users', 'isDemo', 'BOOLEAN NOT NULL DEFAULT false')
    await addCol('users', 'address', 'TEXT')
    await addCol('users', 'latitude', 'DOUBLE PRECISION')
    await addCol('users', 'longitude', 'DOUBLE PRECISION')
    await addCol('users', 'creditBalance', 'INTEGER NOT NULL DEFAULT 0')
    await addCol('users', 'emailVerified', 'BOOLEAN NOT NULL DEFAULT false')
    await addCol('users', 'bankName', 'TEXT')
    await addCol('users', 'bankAccountNumber', 'TEXT')
    await addCol('users', 'bankAccountName', 'TEXT')
    await p.$executeRawUnsafe(`UPDATE "users" SET "emailVerified" = true`)

    // artisan_profiles
    await addCol('artisan_profiles', 'approvalStatus', `TEXT NOT NULL DEFAULT 'PENDING'`)
    await addCol('artisan_profiles', 'verificationStatus', `TEXT NOT NULL DEFAULT 'UNVERIFIED'`)
    await addCol('artisan_profiles', 'isDemo', 'BOOLEAN NOT NULL DEFAULT false')
    await addCol('artisan_profiles', 'verificationDocUrl', 'TEXT')

    // payments
    await addCol('payments', 'creditsApplied', 'INTEGER NOT NULL DEFAULT 0')
    await addCol('payments', 'grossAmount', 'INTEGER NOT NULL DEFAULT 0')
    await addCol('payments', 'escrowStatus', `TEXT NOT NULL DEFAULT 'HELD'`)
    await addCol('payments', 'escrowHeldAt', 'TIMESTAMP(3)')
    await addCol('payments', 'escrowReleasedAt', 'TIMESTAMP(3)')
    await addCol('payments', 'escrowRefundedAt', 'TIMESTAMP(3)')
    await addCol('payments', 'payoutAmount', 'INTEGER')

    // bookings
    await addCol('bookings', 'address', 'TEXT')
    await addCol('bookings', 'customerPhone', 'TEXT')
    await addCol('bookings', 'isUrgent', 'BOOLEAN NOT NULL DEFAULT false')

    // reviews
    await addCol('reviews', 'status', `TEXT NOT NULL DEFAULT 'APPROVED'`)
    await addCol('reviews', 'photoUrl', 'TEXT')

    // Ensure missing tables exist
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "token" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens"("userId")`)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "codeHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL, "used" BOOLEAN NOT NULL DEFAULT false,
        "attempts" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_createdAt_idx" ON "email_verification_tokens"("userId", "createdAt")`)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL, "used" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" TEXT NOT NULL,
        "title" TEXT NOT NULL, "body" TEXT NOT NULL, "link" TEXT,
        "read" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt")`)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "credit_transactions" (
        "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "amount" INTEGER NOT NULL,
        "type" TEXT NOT NULL, "bookingId" TEXT, "balanceAfter" INTEGER NOT NULL,
        "note" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt")`)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" TEXT NOT NULL, "userId" TEXT, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
        "phone" TEXT, "subject" TEXT, "message" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'NEW',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "help_articles" (
        "id" TEXT NOT NULL, "title" TEXT NOT NULL, "category" TEXT NOT NULL,
        "question" TEXT NOT NULL, "answer" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "support_chat_logs" (
        "id" TEXT NOT NULL, "userId" TEXT, "sessionId" TEXT NOT NULL,
        "role" TEXT NOT NULL, "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "support_chat_logs_pkey" PRIMARY KEY ("id")
      )
    `)
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "support_chat_logs_sessionId_createdAt_idx" ON "support_chat_logs"("sessionId", "createdAt")`)
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "disputes" (
        "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "raisedById" TEXT NOT NULL,
        "reason" TEXT NOT NULL, "description" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN',
        "resolution" TEXT, "resolvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
      )
    `)

    await p.$disconnect()
    console.log('Startup fix: all columns verified.')
  } catch (e: any) {
    console.warn('Startup fix error:', e?.message)
  }

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`NaijaHandy API running on http://localhost:${port}`)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API docs available at http://localhost:${port}/api/docs`)
  }
}

bootstrap()
