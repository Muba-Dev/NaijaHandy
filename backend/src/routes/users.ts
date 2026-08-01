import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, city: true, role: true, avatar: true },
  })
  res.json({ data: user })
})

// PATCH /api/users/me
router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, phone, city, avatar } = req.body
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, phone, city, avatar },
    select: { id: true, name: true, email: true, phone: true, city: true, role: true, avatar: true },
  })
  res.json({ data: user })
})

export default router
