import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ArtisanModule } from './artisan/artisan.module'
import { BookingModule } from './booking/booking.module'
import { UserModule } from './user/user.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [PrismaModule, AuthModule, ArtisanModule, BookingModule, UserModule],
})
export class AppModule {}
