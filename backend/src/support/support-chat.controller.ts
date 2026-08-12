import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { createHash } from 'crypto'
import { SupportChatService } from './support-chat.service'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1).max(600),
})

const escalateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  subject: z.string().min(3).max(120).optional(),
  message: z.string().max(2000).optional(),
  transcript: z
    .array(z.object({ question: z.string().max(500), answer: z.string().max(2000) }).strict())
    .max(50)
    .optional(),
})

function ipHash(req: any): string | null {
  const ip = req?.ip
  return ip ? createHash('sha256').update(String(ip)).digest('hex') : null
}

@Controller('api/support')
export class SupportChatController {
  constructor(private supportChatService: SupportChatService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('chat')
  async chat(@Req() req: any, @Body() body: any) {
    try {
      const { message } = chatSchema.parse(body)
      return {
        data: await this.supportChatService.chat({
          userId: req.user?.id,
          ipHash: ipHash(req),
          message,
        }),
      }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('chat/escalate')
  async escalate(@Req() req: any, @Body() body: any) {
    try {
      const input = escalateSchema.parse(body)
      const user = req.user ?? null
      const name = input.name || user?.name || 'NaijaHandy user'
      const email = input.email || user?.email
      if (!email) {
        throw new BadRequestException('An email address is required to escalate to a human.')
      }
      const data = await this.supportChatService.escalate({
        userId: user?.id,
        input: {
          name,
          email,
          phone: input.phone,
          subject: input.subject || 'General question',
          message: input.message,
          transcript: input.transcript,
        },
      })
      return { data }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }
}
