import { Controller, Get, Param, Query, UseGuards, Req, Patch, Body } from '@nestjs/common'
import { ArtisanService } from './artisan.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('api/artisans')
export class ArtisanController {
  constructor(private artisanService: ArtisanService) {}

  @Get()
  async findAll(@Query() query: any) {
    return { data: await this.artisanService.findAll(query), page: Number(query.page) || 1 }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Get('me')
  async findMe(@Req() req: any) {
    return { data: await this.artisanService.findMe(req.user.id) }
  }

  @Get('categories')
  async categories() {
    return { data: await this.artisanService.categoryCounts() }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.artisanService.findOne(id) }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    return { data: await this.artisanService.updateMe(req.user.id, body) }
  }
}
