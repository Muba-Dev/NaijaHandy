import { test, expect } from '@playwright/test'
import { deleteE2EUsers } from './support/db'

const MARKER = `E2E-avatar-${Date.now()}`

test.afterAll(async () => {
  await deleteE2EUsers(MARKER).catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('Profile settings', () => {
  test('uploads a profile photo', async ({ page }) => {
    const email = `${MARKER}@example.com`

    await page.goto('/register')
    await page.locator('main form input[placeholder="Amaka Okonkwo"]').fill('Avatar Tester')
    await page.locator('main form input[placeholder="+234 801 234 5678"]').fill('+234 800 000 0000')
    await page.locator('main form input[type="email"]').fill(email)
    await page.locator('main form select').selectOption({ label: 'Lagos' })
    await page.locator('main form input[type="password"]').fill('password123')
    await page.getByRole('button', { name: 'Create Customer Account' }).click()
    await expect(page).toHaveURL(/\/verify-email\?/, { timeout: 20_000 })

    // Emails are disabled in the test backend, so the code is shown on screen.
    const hint = page.getByText(/your code is \d{6}/)
    await expect(hint).toBeVisible({ timeout: 20_000 })
    const code = (await hint.textContent())!.match(/\d{6}/)![0]
    await page.locator('input[placeholder="••••••"]').fill(code)
    await page.getByRole('button', { name: 'Verify & continue' }).click()
    await expect(page).toHaveURL(/\/dashboard\//, { timeout: 20_000 })

    await page.goto('/settings')
    await expect(page.getByRole('button', { name: 'Change Photo' })).toBeVisible({ timeout: 20_000 })
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/avatar.png')

    await expect(page.getByRole('button', { name: 'Uploading…' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Change Photo' })).toBeVisible({ timeout: 30_000 })

    const img = page.locator('form img[alt="Avatar Tester"]')
    await expect(img).toBeVisible({ timeout: 20_000 })
    await expect
      .poll(async () => (await img.getAttribute('src')) || '', { timeout: 20_000 })
      .toMatch(/^data:image/)
    await expect(page.getByText('Failed to upload')).not.toBeVisible()
  })
})
