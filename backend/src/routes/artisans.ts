import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/artisans — list with filters
router.get('/', async (req: Request, res: Response) => {
  const { category, city, minRating, available, sortBy = 'rating', page = '1', limit = '12' } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const artisans = await prisma.artisanProfile.findMany({
    where: {
      ...(category ? { category: String(category) } : {}),
      ...(city ? { user: { city: String(city) } } : {}),
      ...(minRating ? { avgRating: { gte: Number(minRating) } } : {}),
      ...(available === 'true' ? { available: true } : {}),
    },
    include: {
      user: { select: { id: true, name: true, city: true, avatar: true } },
      services: true,
    },
    orderBy: sortBy === 'hourlyRate' ? { hourlyRate: 'asc' } : { avgRating: 'desc' },
    skip,
    take: Number(limit),
  })

  res.json({ data: artisans, page: Number(page) })
})

// GET /api/artisans/me — own artisan profile (artisan only)
router.get('/me', authenticate, async (req: any, res: Response) => {
  const profile = await prisma.artisanProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { id: true, name: true, city: true, avatar: true, phone: true } }, services: true, portfolio: true },
  })
  if (!profile) return res.status(404).json({ message: 'Artisan profile not found' })
  res.json({ data: profile })
})

// GET /api/artisans/:id — single artisan profile
router.get('/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const artisan = await prisma.artisanProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, city: true, avatar: true, phone: true } },
      services: true,
      portfolio: true,
      reviews: {
        include: { customer: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
  if (!artisan) return res.status(404).json({ message: 'Artisan not found' })
  res.json({ data: artisan })
})

// PATCH /api/artisans/me — update own artisan profile (artisan only)
router.patch('/me', authenticate, async (req: any, res: Response) => {
  const profile = await prisma.artisanProfile.update({
    where: { userId: req.user.id },
    data: req.body,
  })
  res.json({ data: profile })
})

export default router
