import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resolveInterrupted() {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT DISTINCT migration_name FROM _prisma_migrations WHERE finished_at IS NULL'
  )
  for (const row of rows) {
    const name = row.migration_name
    console.log(`Resolving interrupted migration: ${name}`)
    try {
      execSync(`npx prisma migrate resolve --rolled-back "${name}"`, { stdio: 'inherit' })
    } catch {
      console.log(`No action needed for ${name}`)
    }
  }
}

try {
  await resolveInterrupted()
} finally {
  await prisma.$disconnect()
}

execSync('npx prisma migrate deploy', { stdio: 'inherit' })
