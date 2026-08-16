import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { CreditsService } from './credits.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get()
  async wallet(@Req() req: any) {
    return { data: await this.creditsService.wallet(req.user.id) }
  }
}
