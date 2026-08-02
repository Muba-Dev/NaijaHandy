import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common'
import { SavedArtisanService } from './saved-artisan.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/saved-artisans')
@UseGuards(JwtAuthGuard)
export class SavedArtisanController {
  constructor(private savedArtisanService: SavedArtisanService) {}

  @Get()
  async findAll(@Req() req: any) {
    return { data: await this.savedArtisanService.findAll(req.user.id) }
  }

  @Post(':artisanId')
  async save(@Req() req: any, @Param('artisanId') artisanId: string) {
    return { data: await this.savedArtisanService.save(req.user.id, artisanId) }
  }

  @Delete(':artisanId')
  async remove(@Req() req: any, @Param('artisanId') artisanId: string) {
    return { data: await this.savedArtisanService.remove(req.user.id, artisanId) }
  }
}
