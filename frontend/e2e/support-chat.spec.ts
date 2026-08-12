import { test, expect } from '@playwright/test'
import { deleteE2ESupportMessages } from './support/db'

test.afterAll(async () => {
  await deleteE2ESupportMessages('e2e.chat.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('AI support assistant (widget)', () => {
  test('floating widget answers a help question with sources and actions', async ({ page }) => {
    await page.goto('/')

    const launcher = page.getByRole('button', { name: /Chat with the NaijaHandy assistant/ })
    await expect(launcher).toBeVisible()
    await launcher.click()

    const dialog = page.getByRole('dialog', { name: 'NaijaHandy assistant' })
    await expect(dialog).toBeVisible()
    await expect(page.getByText(/Hi, I'm the NaijaHandy assistant/)).toBeVisible()

    await dialog.getByLabel('Ask the NaijaHandy assistant').fill('How do I cancel a booking?')
    await dialog.getByRole('button', { name: 'Send question' }).click()

    // Mock mode returns a deterministic keyword match.
    await expect(page.getByText(/Mock answer: Can I cancel a booking\?/)).toBeVisible({ timeout: 20_000 })
    await expect(dialog.getByRole('link', { name: /Can I cancel a booking\?/ })).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'View my bookings' })).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Contact support' })).toBeVisible()
  })

  test('escalates to a human with the chat transcript', async ({ page }) => {
    await page.goto('/help')
    await page.getByRole('button', { name: /Chat with the NaijaHandy assistant/ }).click()

    const dialog = page.getByRole('dialog', { name: 'NaijaHandy assistant' })
    await dialog.getByLabel('Ask the NaijaHandy assistant').fill('Can I cancel a booking?')
    await dialog.getByRole('button', { name: 'Send question' }).click()
    await expect(page.getByText(/Mock answer: Can I cancel a booking\?/)).toBeVisible({ timeout: 20_000 })

    await dialog.getByRole('button', { name: 'Talk to a human' }).click()
    // Guests are asked for contact details before a ticket is opened.
    await dialog.getByLabel('Your name').fill('E2E Chat Guest')
    await dialog.getByLabel('Your email').fill(`e2e.chat.${Date.now()}@example.com`)
    await dialog.getByRole('button', { name: 'Open support ticket' }).click()

    await expect(page.getByText(/A support ticket is open/)).toBeVisible({ timeout: 20_000 })
  })
})
