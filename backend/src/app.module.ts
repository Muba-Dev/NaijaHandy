import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ArtisanModule } from './artisan/artisan.module'
import { BookingModule } from './booking/booking.module'
import { UserModule } from './user/user.module'
import { SavedArtisanModule } from './saved-artisan/saved-artisan.module'
import { AdminModule } from './admin/admin.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [PrismaModule, AuthModule, ArtisanModule, BookingModule, UserModule, SavedArtisanModule, AdminModule],
})
export class AppModule {}
