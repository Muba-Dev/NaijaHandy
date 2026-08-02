import { Module } from '@nestjs/common'
import { SavedArtisanController } from './saved-artisan.controller'
import { SavedArtisanService } from './saved-artisan.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SavedArtisanController],
  providers: [SavedArtisanService],
})
export class SavedArtisanModule {}
