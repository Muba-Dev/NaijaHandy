import { Module } from '@nestjs/common'
import { ArtisanController } from './artisan.controller'
import { ArtisanService } from './artisan.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [PrismaModule, AuthModule, UploadModule],
  controllers: [ArtisanController],
  providers: [ArtisanService],
})
export class ArtisanModule {}
