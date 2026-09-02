import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma, type ArtisanProfile } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UploadService } from '../upload/upload.service'

export type RequestUser = { id: string; role: string; isDemo: boolean }

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null {
  if (lat2 == null || lng2 == null) return null
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

@Injectable()
export class ArtisanService {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

  private hideDemo(user?: RequestUser): boolean {
    return !!user && user.role !== 'ADMIN' && !user.isDemo
  }

  private demoFilterObj(user?: RequestUser): Prisma.ArtisanProfileWhereInput {
    return this.hideDemo(user) ? { isDemo: false } : {}
  }

  private async findProfileByUserOrThrow(userId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('Artisan profile not found')
    return profile
  }

  async findAll(filters: any, user?: RequestUser): Promise<Array<ArtisanProfile & { distanceKm?: number | null }>> {
    const { q, category, city, minRating, available, sortBy = 'rating', page = 1, limit = 12, minPrice, maxPrice, lat, lng, radius } = filters
    const skip = (Number(page) - 1) * Number(limit)

    const keyword = typeof q === 'string' && q.trim() ? q.trim() : undefined

    const priceBounds = {
      ...(minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice)) ? { gte: Number(minPrice) } : {}),
      ...(maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice)) ? { lte: Number(maxPrice) } : {}),
    }
    const hasPriceFilter = Object.keys(priceBounds).length > 0

    const originLat = lat !== undefined && lat !== '' && !isNaN(Number(lat)) ? Number(lat) : undefined
    const originLng = lng !== undefined && lng !== '' && !isNaN(Number(lng)) ? Number(lng) : undefined
    const hasLocation = originLat !== undefined && originLng !== undefined
    const maxDistanceKm = radius !== undefined && radius !== '' && !isNaN(Number(radius)) ? Number(radius) : 50

    const andClauses: Prisma.ArtisanProfileWhereInput[] = []
    if (keyword) {
      andClauses.push({
        OR: [
          { profession: { contains: keyword, mode: 'insensitive' } },
          { category: { contains: keyword, mode: 'insensitive' } },
          { user: { is: { name: { contains: keyword, mode: 'insensitive' } } } },
        ],
      })
    }
    if (hasPriceFilter) {
      andClauses.push({
        OR: [
          { services: { some: { rate: priceBounds } } },
          { services: { none: {} }, hourlyRate: priceBounds },
        ],
      })
    }

    const userWhere: Prisma.UserWhereInput = { status: { not: 'DELETED' } }
    if (city) userWhere.city = String(city)

    const where: Prisma.ArtisanProfileWhereInput = {
      approvalStatus: 'APPROVED',
      ...(this.hideDemo(user) ? { isDemo: false } : {}),
      ...(category ? { category: String(category) } : {}),
      user: userWhere,
      ...(minRating ? { avgRating: { gte: Number(minRating) } } : {}),
      ...(available === 'true' ? { available: true } : {}),
      ...(andClauses.length ? { AND: andClauses } : {}),
    }

    const include: Prisma.ArtisanProfileInclude = {
      user: { select: { id: true, name: true, city: true, avatar: true, latitude: true, longitude: true } },
      services: true,
    }

    if (hasLocation) {
      // Bounding-box prefilter in SQL so we never load the whole approved set
      // into Node. 1° latitude ≈ 111.32 km; longitude shrinks with cos(lat).
      // Prisma re-applies the full `where` below as a safety net.
      const latDelta = maxDistanceKm / 111.32
      const lngDelta = maxDistanceKm / (111.32 * Math.cos((originLat * Math.PI) / 180))
      const box = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT ap."id"
        FROM "artisan_profiles" ap
        JOIN "users" u ON u."id" = ap."userId"
        WHERE ap."approvalStatus" = 'APPROVED'
          AND u."status" <> 'DELETED'
          AND u."latitude" IS NOT NULL
          AND u."longitude" IS NOT NULL
          AND u."latitude" BETWEEN ${originLat - latDelta} AND ${originLat + latDelta}
          AND u."longitude" BETWEEN ${originLng - lngDelta} AND ${originLng + lngDelta}
      `
      if (box.length === 0) return []

      const artisans = await this.prisma.artisanProfile.findMany({
        where: { ...where, id: { in: box.map((b) => b.id) } },
        include,
      })
      const withDistance = artisans
        .map((a) => {
          const d = haversineKm(originLat, originLng, a.user.latitude, a.user.longitude)
          return { ...a, distanceKm: d == null ? null : Math.round(d * 10) / 10 }
        })
        .filter((a) => a.distanceKm != null && a.distanceKm <= maxDistanceKm)
        .sort((a, b) => a.distanceKm! - b.distanceKm!)
      return withDistance.slice(skip, skip + Number(limit))
    }

    return this.prisma.artisanProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, city: true, avatar: true } }, services: true },
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
        user: { is: { status: { not: 'DELETED' } } },
      },
      _count: { _all: true },
    })
    return groups.map((g) => ({ name: g.category, count: g._count._all }))
  }

  async platformStats(user?: RequestUser) {
    const demoFilter = this.hideDemo(user) ? ' AND ap."isDemo" = false' : ''
    // Aggregate in SQL instead of loading every approved profile into memory
    // just to count unique cities.
    const [profilesStats, jobsCompleted, reviews, totalUsers] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ artisans: number; cities: number }[]>(
        `SELECT COUNT(*)::int AS "artisans", COUNT(DISTINCT u."city")::int AS "cities"
         FROM "artisan_profiles" ap
         JOIN "users" u ON u."id" = ap."userId"
         WHERE ap."approvalStatus" = 'APPROVED'
           AND u."status" <> 'DELETED'
           AND u."city" IS NOT NULL${demoFilter}`,
      ),
      this.prisma.booking.count({
        where: { status: 'COMPLETED', artisan: { approvalStatus: 'APPROVED', ...this.demoFilterObj(user), user: { is: { status: { not: 'DELETED' } } } } },
      }),
      this.prisma.review.count({
        where: { status: 'APPROVED', artisan: { approvalStatus: 'APPROVED', ...this.demoFilterObj(user), user: { is: { status: { not: 'DELETED' } } } } },
      }),
      this.prisma.user.count({ where: { status: { not: 'DELETED' } } }),
    ])
    const row = profilesStats[0]
    return {
      artisans: Number(row?.artisans ?? 0),
      cities: Number(row?.cities ?? 0),
      jobsCompleted,
      reviews,
      totalUsers,
    }
  }

  async findOne(id: string, user?: RequestUser) {
    const artisan = await this.prisma.artisanProfile.findFirst({
      where: {
        id,
        approvalStatus: 'APPROVED',
        ...(this.hideDemo(user) ? { isDemo: false } : {}),
        user: { status: { not: 'DELETED' } },
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
    const { verificationDocUrl: _docUrl, ...publicProfile } = artisan
    return { ...publicProfile, completedJobsCount, recentCompletedJobs }
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
    const profile = await this.findProfileByUserOrThrow(userId)
    const coverImage = await this.uploadService.uploadCover(dataUrl)
    return this.prisma.artisanProfile.update({
      where: { id: profile.id },
      data: { coverImage },
    })
  }

  async addPortfolio(userId: string, dataUrl: string, caption?: string) {
    const profile = await this.findProfileByUserOrThrow(userId)
    const imageUrl = await this.uploadService.uploadPortfolio(dataUrl)
    return this.prisma.portfolioItem.create({
      data: { artisanId: profile.id, imageUrl, caption: caption || null },
    })
  }

  async submitVerificationDocument(userId: string, dataUrl: string) {
    const profile = await this.findProfileByUserOrThrow(userId)
    if (profile.verificationStatus === 'PENDING') {
      throw new BadRequestException('A verification document is already pending review')
    }
    const verificationDocUrl = await this.uploadService.uploadVerificationDocument(dataUrl)
    return this.prisma.artisanProfile.update({
      where: { id: profile.id },
      data: { verificationDocUrl, verificationStatus: 'PENDING' },
    })
  }

  async removePortfolio(userId: string, portfolioId: string) {
    const profile = await this.findProfileByUserOrThrow(userId)
    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: portfolioId, artisanId: profile.id },
    })
    if (!item) throw new NotFoundException('Portfolio item not found')
    await this.prisma.portfolioItem.delete({ where: { id: item.id } })
    return { success: true }
  }
}
