import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://naijahandy.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/bookings', '/saved', '/notifications', '/oauth-callback'],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
