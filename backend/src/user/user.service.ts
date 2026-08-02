import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, city: true, role: true, avatar: true },
    })
  }

  async updateMe(userId: string, data: any) {
    const { name, phone, city, avatar } = data
    return this.prisma.user.update({
      where: { id: userId },
      data: { name, phone, city, avatar },
      select: { id: true, name: true, email: true, phone: true, city: true, role: true, avatar: true },
    })
  }
}
