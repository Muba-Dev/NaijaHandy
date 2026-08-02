import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SavedArtisanService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const saved = await this.prisma.savedArtisan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        artisan: {
          include: {
            user: { select: { id: true, name: true, city: true, avatar: true } },
            services: true,
          },
        },
      },
    })
    return saved.map((s) => s.artisan)
  }

  async save(userId: string, artisanId: string) {
    const artisan = await this.prisma.artisanProfile.findUnique({ where: { id: artisanId } })
    if (!artisan) throw new NotFoundException('Artisan not found')

    await this.prisma.savedArtisan.upsert({
      where: { userId_artisanId: { userId, artisanId } },
      update: {},
      create: { userId, artisanId },
    })
    return { saved: true }
  }

  async remove(userId: string, artisanId: string) {
    await this.prisma.savedArtisan.deleteMany({ where: { userId, artisanId } })
    return { saved: false }
  }
}
