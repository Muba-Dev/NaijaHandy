import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private readonly select = {
    id: true, name: true, email: true, phone: true, city: true, address: true,
    latitude: true, longitude: true, role: true, avatar: true, creditBalance: true,
  } as const

  async findMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: this.select,
    })
  }

  async updateMe(userId: string, data: any) {
    const { name, phone, city, avatar, address, latitude, longitude } = data

    let lat: number | undefined
    let lng: number | undefined
    if (latitude !== undefined || longitude !== undefined) {
      lat = Number(latitude)
      lng = Number(longitude)
      if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new BadRequestException('Invalid coordinates')
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        city,
        avatar,
        address,
        latitude: lat,
        longitude: lng,
      },
      select: this.select,
    })
  }
}
