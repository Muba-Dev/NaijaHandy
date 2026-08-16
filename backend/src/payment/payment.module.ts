import { Module } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { NotificationsModule } from '../notifications/notifications.module'
import { CreditsModule } from '../credits/credits.module'

@Module({
  imports: [NotificationsModule, CreditsModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
