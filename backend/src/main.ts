import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { AppModule } from './app.module'
import dotenv from 'dotenv'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.use(helmet())
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' })
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'))
  }
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  )
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

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

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`NaijaHandy API running on http://localhost:${port}`)
  console.log(`API docs available at http://localhost:${port}/api/docs`)
}

bootstrap()
