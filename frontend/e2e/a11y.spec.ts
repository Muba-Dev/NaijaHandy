import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, createBookableArtisan } from './support/helpers'
import { deleteE2EUsers } from './support/db'

const API_URL = 'http://localhost:4000/api'

test.afterAll(async () => {
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

async function topArtisanId(): Promise<string> {
  const res = await fetch(`${API_URL}/artisans`)
  if (!res.ok) throw new Error(`GET /api/artisans failed: ${res.status}`)
  const json = (await res.json()) as { data: Array<{ id: string }> }
  if (!json.data || json.data.length === 0) throw new Error('No artisans returned by the API')
  return json.data[0].id
}

async function loginAsArtisan(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.locator('main form input[type="email"]').fill(email)
  await page.locator('main form input[type="password"]').fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/\/dashboard\/artisan/, { timeout: 30_000 })
}

async function visitSettled(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
  await page.waitForTimeout(500)
}

async function expectNoAxeViolations(page: Page, path: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  if (serious.length > 0) {
    console.log(`axe violations on ${path}:`)
    console.log(JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.html) })), null, 2))
  }
  expect(serious, `${path} has serious/critical axe violations`).toEqual([])
}

test.describe('Accessibility (axe)', () => {
  test('public pages have no serious/critical violations', async ({ page }) => {
    test.setTimeout(240_000)
    const artisanId = await topArtisanId()
    const pages = ['/', '/search', '/login', '/register', '/forgot-password', `/artisans/${artisanId}`]
    for (const path of pages) {
      await visitSettled(page, path)
      await expectNoAxeViolations(page, path)
    }
  })

  test('customer pages have no serious/critical violations', async ({ page }) => {
    test.setTimeout(240_000)
    await login(page)
    const pages = ['/dashboard/customer', '/bookings', '/saved', '/settings', '/notifications']
    for (const path of pages) {
      await visitSettled(page, path)
      await expectNoAxeViolations(page, path)
    }
  })

  test('artisan dashboard pages have no serious/critical violations', async ({ page }) => {
    test.setTimeout(240_000)
    const artisan = await createBookableArtisan()
    await loginAsArtisan(page, artisan.email)
    const pages = [
      '/dashboard/artisan',
      '/dashboard/artisan/requests',
      '/dashboard/artisan/schedule',
      '/dashboard/artisan/earnings',
      '/dashboard/artisan/profile',
    ]
    for (const path of pages) {
      await visitSettled(page, path)
      await expectNoAxeViolations(page, path)
    }
  })
})
