import { test, expect } from '@playwright/test'
import { createBookableArtisan } from './support/helpers'
import { addE2EService, deleteE2EUsers } from './support/db'

test.afterAll(async () => {
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('Search filters', () => {
  test('price filter narrows results to the selected band', async ({ page }) => {
    const cheap = await createBookableArtisan()
    await addE2EService(cheap.id, 'Budget Job', 3000)
    const pricey = await createBookableArtisan()
    await addE2EService(pricey.id, 'Premium Job', 25000)

    await page.goto('/search')
    await page.getByRole('button', { name: /Filters/ }).click()
    const searchInput = page.getByLabel('Search by name, skill or category')
    await searchInput.fill(cheap.user.name)
    await page.getByRole('button', { name: 'Under ₦5,000' }).click()
    await expect(page.getByText(cheap.user.name)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('No artisans match your filters')).not.toBeVisible()

    await searchInput.fill(pricey.user.name)
    await expect(page.getByText('No artisans match your filters')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(pricey.user.name)).toHaveCount(0)
  })

  test('distance filter shows only artisans within the radius of the browser location', async ({ page, context }) => {
    const nearLat = 6.5244
    const nearLng = 3.3792
    const near = await createBookableArtisan({ latitude: nearLat, longitude: nearLng })
    const far = await createBookableArtisan({ latitude: nearLat + 0.5, longitude: nearLng })

    await context.grantPermissions(['geolocation'], { origin: 'http://localhost:3000' })
    await context.setGeolocation({ latitude: nearLat, longitude: nearLng })
    await page.goto('/search')
    await page.getByRole('button', { name: /Filters/ }).click()

    const searchInput = page.getByLabel('Search by name, skill or category')
    await searchInput.fill(near.user.name)
    await page.getByRole('button', { name: 'Use my location' }).click()
    await expect(page.getByText(near.user.name)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('0 km away').first()).toBeVisible()

    await searchInput.fill(far.user.name)
    await expect(page.getByText('No artisans match your filters')).toBeVisible({ timeout: 20_000 })
  })
})
