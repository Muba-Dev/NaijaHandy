import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Ensuring emailVerified column exists...')

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'emailVerified'
      ) THEN
        ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
      END IF;
    END $$;
  `)

  await prisma.$executeRawUnsafe(`UPDATE "users" SET "emailVerified" = true`)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "codeHash" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_createdAt_idx"
      ON "email_verification_tokens"("userId", "createdAt")
  `)

  console.log('emailVerified column verified.')
}

main()
  .catch((e) => { console.error('Fix script failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
