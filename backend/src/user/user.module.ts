import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { PrismaModule } from '../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
