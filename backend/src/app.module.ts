import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ArtisanModule } from './artisan/artisan.module'
import { BookingModule } from './booking/booking.module'
import { UserModule } from './user/user.module'
import { SavedArtisanModule } from './saved-artisan/saved-artisan.module'
import { AdminModule } from './admin/admin.module'
import { PaymentModule } from './payment/payment.module'
import { NotificationsModule } from './notifications/notifications.module'
import { EmailModule } from './email/email.module'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { SupportModule } from './support/support.module'
import { CreditsModule } from './credits/credits.module'

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuthModule,
    ArtisanModule,
    BookingModule,
    UserModule,
    SavedArtisanModule,
    AdminModule,
    PaymentModule,
    NotificationsModule,
    HealthModule,
    SupportModule,
    CreditsModule,
  ],
})
export class AppModule {}
