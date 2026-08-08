import { test, expect } from '@playwright/test'

const APP_URL = 'https://naijahandy.vercel.app'
const API_URL = 'http://localhost:4000/api'

async function topArtisan(): Promise<{ id: string; user: { name: string }; profession: string }> {
  const res = await fetch(`${API_URL}/artisans`)
  if (!res.ok) throw new Error(`GET /api/artisans failed: ${res.status}`)
  const json = (await res.json()) as { data: Array<{ id: string; user: { name: string }; profession: string }> }
  if (!json.data || json.data.length === 0) throw new Error('No artisans returned by the API')
  return json.data[0]
}

test.describe('SEO (robots.txt, sitemap, metadata)', () => {
  test('robots.txt disallows private routes and references the sitemap', async ({ page }) => {
    const res = await page.request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()
    const text = await res.text()
    for (const path of ['/dashboard', '/settings', '/bookings', '/saved', '/notifications', '/oauth-callback']) {
      expect(text, `robots.txt should disallow ${path}`).toContain(`Disallow: ${path}`)
    }
    expect(text).toContain('Sitemap:')
  })

  test('sitemap.xml lists public pages and artisan profiles', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml')
    expect(res.ok()).toBeTruthy()
    const text = await res.text()
    expect(text).toContain('<urlset')
    expect(text).toMatch(new RegExp(`<loc>${APP_URL.replace('/', '\\/')}/search<\\/loc>`))
    expect(text).toMatch(new RegExp(`<loc>${APP_URL.replace('/', '\\/')}/artisans/`))
  })

  test('artisan profile page emits title, description, canonical and OpenGraph meta', async ({ page }) => {
    const artisan = await topArtisan()
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page).toHaveTitle(`${artisan.user.name} — ${artisan.profession} | NaijaHandy`, { timeout: 20_000 })
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toBeTruthy()
    await expect(page.locator(`link[rel="canonical"][href$="/artisans/${artisan.id}"]`)).toHaveCount(1)
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toContain(artisan.user.name)
  })
})
