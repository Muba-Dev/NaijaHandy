import { Module } from '@nestjs/common'
import { SupportController } from './support.controller'
import { SupportService } from './support.service'
import { HelpController } from './help.controller'
import { HelpService } from './help.service'
import { SupportChatController } from './support-chat.controller'
import { SupportChatService } from './support-chat.service'
import { RolesGuard } from '../auth/roles.guard'
import { PrismaModule } from '../prisma/prisma.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [SupportController, HelpController, SupportChatController],
  providers: [SupportService, HelpService, SupportChatService, RolesGuard],
})
export class SupportModule {}
