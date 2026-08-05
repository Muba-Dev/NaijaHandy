import { Module } from '@nestjs/common'
import { ArtisanController } from './artisan.controller'
import { ArtisanService } from './artisan.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ArtisanController],
  providers: [ArtisanService],
})
export class ArtisanModule {}
