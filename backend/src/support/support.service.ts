import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from '../email/email.service'

export type CreateSupportMessageInput = {
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
}

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: string | undefined, input: CreateSupportMessageInput) {
    const user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      : null

    const created = await this.prisma.supportMessage.create({
      data: {
        userId: user?.id ?? null,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
      },
    })

    await this.emailService.sendSupportMessageEmail({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      message: input.message,
    })

    return created
  }
}
