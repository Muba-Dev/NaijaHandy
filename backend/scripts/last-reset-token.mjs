import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const record = await prisma.$queryRawUnsafe(
    `SELECT token, "expiresAt", "used"
     FROM password_reset_tokens
     ORDER BY "createdAt" DESC
     LIMIT 1`
  )
  if (!record.length) {
    console.error('No password reset tokens found. Request a reset first (POST /api/auth/forgot-password).')
    process.exit(1)
  }
  const { token, expiresAt, used } = record[0]
  const base = process.env.FRONTEND_URL || 'http://localhost:3000'
  console.log(`Token:   ${token}`)
  console.log(`Used:    ${used}`)
  console.log(`Expires: ${expiresAt}`)
  console.log(`Reset link:\n${base}/reset-password?token=${token}`)
} finally {
  await prisma.$disconnect()
}
