import { PrismaClient } from '@prisma/client'

// Recompute avgRating / totalReviews from the APPROVED Review rows for
// non-demo artisans only. Demo artisans keep their seeded (fake) numbers —
// their ratings have no backing Review rows and are labelled demo.
//
// Usage: npm run db:recompute-ratings

const prisma = new PrismaClient()

async function main() {
  const profiles = await prisma.artisanProfile.findMany({
    select: { id: true, isDemo: true },
  })
  if (!profiles.length) {
    console.log('No artisan profiles found — nothing to recompute.')
    return
  }

  const groups = await prisma.review.groupBy({
    by: ['artisanId'],
    where: { status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const byArtisan = new Map(groups.map((g) => [g.artisanId, g]))

  const updates = profiles
    .filter((p) => !p.isDemo)
    .map((p) => {
      const g = byArtisan.get(p.id)
      const totalReviews = g?._count._all ?? 0
      const rawAvg = g?._avg.rating
      const avgRating = rawAvg != null ? Math.round(rawAvg * 100) / 100 : 0
      return { id: p.id, totalReviews, avgRating }
    })

  for (const u of updates) {
    await prisma.artisanProfile.update({
      where: { id: u.id },
      data: { totalReviews: u.totalReviews, avgRating: u.avgRating },
    })
  }

  const skippedDemo = profiles.length - updates.length
  const zeroReview = updates.filter((u) => u.totalReviews === 0).length

  console.log(`Recomputed ratings for ${updates.length} non-demo artisan(s).`)
  console.log(`Skipped ${skippedDemo} demo artisan(s) — ratings kept as-is.`)
  if (zeroReview) {
    console.log(`Note: ${zeroReview} non-demo artisan(s) have no APPROVED reviews and were reset to 0.`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
