import { Module } from '@nestjs/common'
import { ArtisanController } from './artisan.controller'
import { ArtisanService } from './artisan.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ArtisanController],
  providers: [ArtisanService],
})
export class ArtisanModule {}
