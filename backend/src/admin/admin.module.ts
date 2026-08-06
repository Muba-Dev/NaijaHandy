import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { RolesGuard } from '../auth/roles.guard'
import { PrismaModule } from '../prisma/prisma.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
