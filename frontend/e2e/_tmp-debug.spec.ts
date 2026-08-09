import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, createBookableArtisan } from './support/helpers'

test('debug catch transient overlay', async ({ page }) => {
  const artisan = await createBookableArtisan()
  await page.goto('/login')
  await page.locator('main form input[type="email"]').fill(artisan.email)
  await page.locator('main form input[type="password"]').fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/\/dashboard\/artisan/, { timeout: 15_000 })

  for (let round = 0; round < 5; round++) {
    for (const path of ['/dashboard/artisan', '/dashboard/artisan/requests', '/dashboard/artisan/schedule', '/dashboard/artisan/earnings', '/dashboard/artisan/profile']) {
      await page.goto(path)
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
      const results = await new AxeBuilder({ page }).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      if (serious.length > 0) {
        console.log(`CAUGHT on ${path} round ${round}`)
        for (const v of serious) {
          const n = v.nodes[0]
          console.log(JSON.stringify({ id: v.id, html: n.html.slice(0, 140), any: n.any[0]?.data }))
        }
        await page.screenshot({ path: `test-results/debug-caught-${round}.png` })
        return
      }
    }
  }
  console.log('NOT CAUGHT in 5 rounds')
})
