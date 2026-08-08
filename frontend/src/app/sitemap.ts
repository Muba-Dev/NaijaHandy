import type { MetadataRoute } from 'next'
import { fetchArtisans } from '@/lib/api'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://naijahandy.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${APP_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  try {
    const artisans = await fetchArtisans({ limit: '100' })
    for (const a of artisans) {
      entries.push({
        url: `${APP_URL}/artisans/${a.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch {
    // The API may be unreachable at build time; the static routes above still work.
  }

  return entries
}
