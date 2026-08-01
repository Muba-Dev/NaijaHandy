import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'
import { z } from 'zod'
import { BOOKING_STATUSES, canTransitionBookingStatus } from '../domain/booking'

const router = Router()
const prisma = new PrismaClient()

const createSchema = z.object({
  artisanId: z.string(),
  date: z.string(),
  time: z.string(),
  description: z.string().min(10),
  amount: z.number().int().positive(),
})

// POST /api/bookings — create booking (customer)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body)
    const booking = await prisma.booking.create({
      data: {
        customerId: req.user!.id,
        artisanId: data.artisanId,
        date: new Date(data.date),
        time: data.time,
        description: data.description,
        amount: data.amount,
      },
    })
    res.status(201).json({ data: booking })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors })
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/bookings — list user's bookings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { status } = req.query
  const isArtisan = req.user!.role === 'ARTISAN'

  const profile = isArtisan
    ? await prisma.artisanProfile.findUnique({ where: { userId: req.user!.id } })
    : null

  const bookings = await prisma.booking.findMany({
    where: {
      ...(isArtisan ? { artisanId: profile?.id } : { customerId: req.user!.id }),
      ...(status ? { status: String(status) as any } : {}),
    },
    include: {
      artisan: { include: { user: { select: { name: true, avatar: true } } } },
      customer: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ data: bookings })
})

// PATCH /api/bookings/:id/status — accept/decline/complete
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = z.object({ status: z.enum(BOOKING_STATUSES) }).parse(req.body)
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const current = await prisma.booking.findUnique({
      where: { id },
      include: { artisan: { select: { userId: true } } },
    })
    if (!current) return res.status(404).json({ message: 'Booking not found' })

    const isCustomer = current.customerId === req.user!.id
    const isArtisan = current.artisan.userId === req.user!.id
    const customerCanCancel = isCustomer && status === 'CANCELLED'
    const artisanCanUpdate = isArtisan && ['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)
    if (!customerCanCancel && !artisanCanUpdate) {
      return res.status(403).json({ message: 'You cannot update this booking' })
    }
    if (!canTransitionBookingStatus(current.status, status)) {
      return res.status(409).json({ message: `Cannot change booking from ${current.status} to ${status}` })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    })
    res.json({ data: booking })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.errors })
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
