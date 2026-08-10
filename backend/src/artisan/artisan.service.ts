import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UploadService } from '../upload/upload.service'

export type RequestUser = { id: string; role: string; isDemo: boolean }

@Injectable()
export class ArtisanService {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

  private hideDemo(user?: RequestUser): boolean {
    return !!user && user.role !== 'ADMIN' && !user.isDemo
  }

  async findAll(filters: any, user?: RequestUser) {
    const { q, category, city, minRating, available, sortBy = 'rating', page = 1, limit = 12 } = filters
    const skip = (Number(page) - 1) * Number(limit)

    const keyword = typeof q === 'string' && q.trim() ? q.trim() : undefined

    return this.prisma.artisanProfile.findMany({
      where: {
        approvalStatus: 'APPROVED',
        ...(this.hideDemo(user) ? { isDemo: false } : {}),
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

  async categoryCounts(user?: RequestUser) {
    const groups = await this.prisma.artisanProfile.groupBy({
      by: ['category'],
      where: {
        approvalStatus: 'APPROVED',
        ...(this.hideDemo(user) ? { isDemo: false } : {}),
      },
      _count: { _all: true },
    })
    return groups.map((g) => ({ name: g.category, count: g._count._all }))
  }

  async findOne(id: string, user?: RequestUser) {
    const artisan = await this.prisma.artisanProfile.findFirst({
      where: {
        id,
        approvalStatus: 'APPROVED',
        ...(this.hideDemo(user) ? { isDemo: false } : {}),
      },
      include: {
        user: { select: { id: true, name: true, city: true, avatar: true, phone: true, address: true, latitude: true, longitude: true } },
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
    const [completedJobsCount, recentCompletedJobs] = await Promise.all([
      this.prisma.booking.count({ where: { artisanId: id, status: 'COMPLETED' } }),
      this.prisma.booking.findMany({
        where: { artisanId: id, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, description: true, date: true },
      }),
    ])
    return { ...artisan, completedJobsCount, recentCompletedJobs }
  }

  async findMe(userId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, city: true, avatar: true, phone: true, address: true, latitude: true, longitude: true } }, services: true, portfolio: true },
    })
    if (!profile) throw new NotFoundException('Artisan profile not found')
    return profile
  }

  async updateMe(userId: string, data: any) {
    const allowed = ['profession', 'category', 'bio', 'hourlyRate', 'coverImage', 'available'] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (data[key] !== undefined) patch[key] = data[key]
    }
    return this.prisma.artisanProfile.update({ where: { userId }, data: patch })
  }

  async updateCover(userId: string, dataUrl: string) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('Artisan profile not found')
    const coverImage = await this.uploadService.uploadCover(dataUrl)
    return this.prisma.artisanProfile.update({
      where: { id: profile.id },
      data: { coverImage },
    })
  }

  async addPortfolio(userId: string, dataUrl: string, caption?: string) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('Artisan profile not found')
    const imageUrl = await this.uploadService.uploadPortfolio(dataUrl)
    return this.prisma.portfolioItem.create({
      data: { artisanId: profile.id, imageUrl, caption: caption || null },
    })
  }

  async removePortfolio(userId: string, portfolioId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('Artisan profile not found')
    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: portfolioId, artisanId: profile.id },
    })
    if (!item) throw new NotFoundException('Portfolio item not found')
    await this.prisma.portfolioItem.delete({ where: { id: item.id } })
    return { success: true }
  }
}
