import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { embedTexts, isLlmConfigured } from './llm'

export const HELP_CATEGORIES = [
  'Getting started',
  'Booking & payments',
  'Trust & safety',
  'Disputes & guarantee',
  'For artisans',
] as const

@Injectable()
export class HelpService {
  private readonly logger = new Logger(HelpService.name)

  constructor(private prisma: PrismaService) {}

  async listArticles() {
    const articles = await this.prisma.helpArticle.findMany({
      select: { id: true, slug: true, category: true, title: true, content: true, order: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })

    const grouped = new Map<string, typeof articles>()
    for (const category of HELP_CATEGORIES) grouped.set(category, [])
    for (const a of articles) {
      const bucket = grouped.get(a.category)
      if (bucket) bucket.push(a)
      else grouped.set(a.category, [a])
    }

    return Array.from(grouped.entries()).map(([category, items]) => ({ category, items }))
  }

  // Generates embeddings for any articles missing one. Returns the number of
  // articles embedded. Requires an OpenAI key (embedTexts returns null otherwise).
  async embedMissing(): Promise<number> {
    if (!isLlmConfigured()) {
      throw new ServiceUnavailableException('LLM_API_KEY is not configured; cannot generate embeddings')
    }
    const missing = await this.prisma.$queryRaw<{ id: string; title: string; content: string }[]>`
      SELECT "id", "title", "content" FROM "help_articles" WHERE "embedding" IS NULL ORDER BY "order" ASC
    `
    if (missing.length === 0) return 0

    let embedded = 0
    for (const a of missing) {
      const text = `${a.title}\n${a.content}`
      const [vector] = (await embedTexts([text])) ?? [null]
      if (!vector) continue
      const literal = `[${vector.join(',')}]`
      await this.prisma.$executeRaw`
        UPDATE "help_articles" SET "embedding" = ${literal}::vector, "updatedAt" = now() WHERE "id" = ${a.id}
      `
      embedded += 1
    }
    this.logger.log(`[help] embedded ${embedded}/${missing.length} articles`)
    return embedded
  }
}
