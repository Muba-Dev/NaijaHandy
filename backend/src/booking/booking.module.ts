import { Module } from '@nestjs/common'
import { BookingController } from './booking.controller'
import { BookingService } from './booking.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
