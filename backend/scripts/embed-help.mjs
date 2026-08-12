import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

// Generate pgvector embeddings for Help Centre articles that don't have one,
// using the OpenAI embedding model configured via EMBEDDING_MODEL (default
// text-embedding-3-small, 1536 dims — matches the schema's vector(1536)).
//
// Usage: npm run db:embed-help
// Requires LLM_API_KEY. Idempotent; skips articles that already have an
// embedding. The same job can be run as an admin via POST /api/help/articles/embed.

const prisma = new PrismaClient()

async function main() {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    console.error('LLM_API_KEY is not set — nothing to embed. Add it to backend/.env')
    process.exit(1)
  }

  const missing = await prisma.$queryRaw`
    SELECT "id", "title", "content" FROM "help_articles" WHERE "embedding" IS NULL ORDER BY "order" ASC
  `
  if (!Array.isArray(missing) || missing.length === 0) {
    console.log('All help articles already have embeddings.')
    return
  }

  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  const client = new OpenAI({ apiKey })

  let embedded = 0
  for (const a of missing) {
    const text = `${a.title}\n${a.content}`
    const res = await client.embeddings.create({ model, input: text })
    const vector = res.data[0].embedding
    const literal = `[${vector.join(',')}]`
    await prisma.$executeRaw`
      UPDATE "help_articles" SET "embedding" = ${literal}::vector, "updatedAt" = now() WHERE "id" = ${a.id}
    `
    embedded += 1
  }

  console.log(`Embedded ${embedded}/${missing.length} help article(s) with ${model}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
