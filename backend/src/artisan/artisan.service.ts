import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ArtisanService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: any) {
    const { q, category, city, minRating, available, sortBy = 'rating', page = 1, limit = 12 } = filters
    const skip = (Number(page) - 1) * Number(limit)

    const keyword = typeof q === 'string' && q.trim() ? q.trim() : undefined

    return this.prisma.artisanProfile.findMany({
      where: {
        approvalStatus: 'APPROVED',
        ...(keyword
          ? {
              OR: [
                { profession: { contains: keyword, mode: 'insensitive' } },
                { category: { contains: keyword, mode: 'insensitive' } },
                { user: { is: { name: { contains: keyword, mode: 'insensitive' } } } },
              ],
            }
          : {}),
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
  }

  async findOne(id: string) {
    const artisan = await this.prisma.artisanProfile.findFirst({
      where: { id, approvalStatus: 'APPROVED' },
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
    if (!artisan) throw new NotFoundException('Artisan not found')
    return artisan
  }

  async findMe(userId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, city: true, avatar: true, phone: true } }, services: true, portfolio: true },
    })
    if (!profile) throw new NotFoundException('Artisan profile not found')
    return profile
  }

  async updateMe(userId: string, data: any) {
    return this.prisma.artisanProfile.update({ where: { userId }, data })
  }
}
