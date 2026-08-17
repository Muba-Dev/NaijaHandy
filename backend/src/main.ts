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
