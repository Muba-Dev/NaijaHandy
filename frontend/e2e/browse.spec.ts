import { test, expect } from '@playwright/test'
import { createBookableArtisan } from './support/helpers'
import { deleteE2EUsers } from './support/db'

test.afterAll(async () => {
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

async function getTopArtisan() {
  const res = await fetch('http://localhost:4000/api/artisans')
  if (!res.ok) throw new Error(`GET /api/artisans failed: ${res.status}`)
  const json = (await res.json()) as { data: Array<{ id: string; user: { name: string }; profession: string }> }
  if (!json.data || json.data.length === 0) throw new Error('No artisans returned by the API')
  return json.data[0]
}

test.describe('Browsing artisans', () => {
  test('search page lists artisans from the API', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByText('Emeka Okafor')).toBeVisible({ timeout: 20_000 })
  })

  test('demo artisan profile shows the not-bookable notice', async ({ page }) => {
    const artisan = await getTopArtisan()
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await expect(page.getByText('Demo profile — not bookable').first()).toBeVisible()
    await expect(page.getByPlaceholder('Describe the job in detail...')).not.toBeVisible()
  })

  test('bookable artisan profile shows details and the booking form', async ({ page }) => {
    const artisan = await createBookableArtisan()
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await expect(page.getByText('Proceed to Book & Pay')).toBeVisible()
    await expect(page.getByPlaceholder('Describe the job in detail...')).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})
