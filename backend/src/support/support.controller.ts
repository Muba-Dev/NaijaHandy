import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { SupportService } from './support.service'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(2000),
})

@Controller('api/support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('messages')
  async create(@Req() req: any, @Body() body: any) {
    try {
      const data = createSchema.parse(body)
      return { data: await this.supportService.create(req.user?.id, data) }
    } catch (err) {
      if (err instanceof z.ZodError) throw new BadRequestException(err.errors)
      throw err
    }
  }
}
