import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { AppModule } from './app.module'
import dotenv from 'dotenv'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(helmet())
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' })
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  )
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`NaijaHandy API running on http://localhost:${port}`)
}

bootstrap()
