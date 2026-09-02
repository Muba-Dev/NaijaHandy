import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { AppModule } from './app.module'
import { FRONTEND_URL, HTTP, PORT } from './config'
import dotenv from 'dotenv'

dotenv.config()

const rawBodyCapture = (req: express.Request, _res: express.Response, buffer: Buffer) => {
  if (Buffer.isBuffer(buffer)) (req as express.Request & { rawBody: Buffer }).rawBody = buffer
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false })
  app.use(helmet())
  app.set('trust proxy', 1)
  app.enableCors({ origin: FRONTEND_URL() })
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'))
  }
  app.use(rateLimit(HTTP.rateLimit))
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json({ limit: HTTP.jsonBodyLimit, verify: rawBodyCapture }))
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

  // Schema stays in sync via `prisma migrate deploy` (run in CI and in the
  // Render build command). No inline ALTER/UPDATE safety net here — the
  // migration history in prisma/migrations is the single source of truth.

  await app.listen(PORT)
  console.log(`NaijaHandy API running on http://localhost:${PORT}`)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API docs available at http://localhost:${PORT}/api/docs`)
  }
}

bootstrap()