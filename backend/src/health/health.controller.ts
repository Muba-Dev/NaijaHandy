import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('api/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', db: 'up', timestamp: new Date().toISOString() }
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down', timestamp: new Date().toISOString() })
    }
  }
}
