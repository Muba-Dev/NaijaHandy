import { expect, type Page } from '@playwright/test'

export const CUSTOMER_EMAIL = 'chisom@example.com'
export const CUSTOMER_PASSWORD = 'password123'

export async function login(
  page: Page,
  email = CUSTOMER_EMAIL,
  password = CUSTOMER_PASSWORD,
): Promise<void> {
  await page.goto('/login')
  await page.locator('form input[type="email"]').fill(email)
  await page.locator('form input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/\/dashboard\/customer/, { timeout: 15_000 })
}
