import { test, expect } from '@playwright/test'
import { deleteE2EUsers } from './support/db'

test.afterAll(async () => {
  await deleteE2EUsers('e2e.help.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('Help Centre', () => {
  test('help page shows FAQ categories and expands an answer', async ({ page }) => {
    await page.goto('/help')
    await expect(page.getByRole('heading', { level: 1, name: 'How can we help?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Getting started/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Booking & payments/ })).toBeVisible()

    await page.getByRole('button', { name: /How do I book an artisan\?/ }).click()
    await expect(page.getByText(/Search or browse for an artisan/)).toBeVisible()
  })

  test('contact form sends a support message with a success banner', async ({ page }) => {
    const email = `e2e.help.${Date.now()}@example.com`
    await page.goto('/help')
    await page.getByLabel('Name').fill('E2E Help User')
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
    await page.getByLabel('Phone (optional)').fill('08012345678')
    await page.getByLabel('Subject').selectOption({ label: 'Booking or payment issue' })
    await page.getByLabel('Message').fill('I need help with a refund for a cancelled booking.')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText(/Message sent/)).toBeVisible({ timeout: 20_000 })
  })
})
