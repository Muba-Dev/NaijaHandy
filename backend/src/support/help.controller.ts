import { Controller, Get, Post, UseGuards, Header } from '@nestjs/common'
import { HelpService } from './help.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('api/help')
export class HelpController {
  constructor(private helpService: HelpService) {}

  @Get('articles')
  // Help articles are a public, infrequently-changing corpus (also the RAG
  // source) — safe to cache briefly so repeated loads don't re-read from DB.
  @Header('Cache-Control', 'public, max-age=300')
  async list() {
    return { data: await this.helpService.listArticles() }
  }

  // Generates embeddings for help articles missing one (RAG corpus). Requires
  // LLM_API_KEY. Called after the corpus is seeded or edited.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('articles/embed')
  async embed() {
    return { data: { embedded: await this.helpService.embedMissing() } }
  }
}
