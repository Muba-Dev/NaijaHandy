import { test, expect } from '@playwright/test'

test.describe('Urgent / same-day fast path', () => {
  test('home page links to same-day help that preselects available artisans', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Urgent\? Find same-day help/ })).toHaveAttribute('href', '/search?available=1')

    await page.getByRole('link', { name: /Urgent\? Find same-day help/ }).click()
    await expect(page).toHaveURL(/\/search\?available=1/, { timeout: 15_000 })
    await expect(page.getByRole('checkbox', { name: 'Available now only' })).toBeChecked({ timeout: 15_000 })
  })
})
