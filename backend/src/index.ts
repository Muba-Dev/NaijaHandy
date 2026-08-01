import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth'
import artisanRoutes from './routes/artisans'
import bookingRoutes from './routes/bookings'
import userRoutes from './routes/users'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use('/api', limiter)

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/artisans', artisanRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/users', userRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ArtisanNG API running on http://localhost:${PORT}`)
})

export default app
