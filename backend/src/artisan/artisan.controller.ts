import { Controller, Get, Param, Query, UseGuards, Req, Patch, Body, Post, Delete } from '@nestjs/common'
import { ArtisanService } from './artisan.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('api/artisans')
export class ArtisanController {
  constructor(private artisanService: ArtisanService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    return { data: await this.artisanService.findAll(query, req.user), page: Number(query.page) || 1 }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Get('me')
  async findMe(@Req() req: any) {
    return { data: await this.artisanService.findMe(req.user.id) }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('categories')
  async categories(@Req() req: any) {
    return { data: await this.artisanService.categoryCounts(req.user) }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return { data: await this.artisanService.findOne(id, req.user) }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    return { data: await this.artisanService.updateMe(req.user.id, body) }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Post('me/cover')
  async updateCover(@Req() req: any, @Body() body: { image?: string }) {
    return { data: await this.artisanService.updateCover(req.user.id, body.image || '') }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Post('me/portfolio')
  async addPortfolio(@Req() req: any, @Body() body: { image?: string; caption?: string }) {
    return { data: await this.artisanService.addPortfolio(req.user.id, body.image || '', body.caption) }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Post('me/verification-document')
  async submitVerificationDocument(@Req() req: any, @Body() body: { image?: string }) {
    return { data: await this.artisanService.submitVerificationDocument(req.user.id, body.image || '') }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ARTISAN')
  @Delete('me/portfolio/:id')
  async removePortfolio(@Req() req: any, @Param('id') id: string) {
    return { data: await this.artisanService.removePortfolio(req.user.id, id) }
  }
}
