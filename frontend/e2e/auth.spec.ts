import { test, expect } from '@playwright/test'
import { login } from './support/helpers'

test.describe('Authentication', () => {
  test('redirects unauthenticated users from protected pages to login', async ({ page }) => {
    await page.goto('/dashboard/customer')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('rejects invalid credentials with an error message', async ({ page }) => {
    await page.goto('/login')
    await page.locator('main form input[type="email"]').fill('nobody@example.com')
    await page.locator('main form input[type="password"]').fill('wrong-password')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByText(/Invalid credentials|Login failed/)).toBeVisible({ timeout: 15_000 })
  })

  test('logs in as a customer and lands on the dashboard', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Chisom')
  })

  test('logs out and returns to home with protected pages locked', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Log Out' }).first().click()
    await expect(page).toHaveURL(/\/login(\?.*)?$|\/$/, { timeout: 30_000 })
    await page.goto('/dashboard/customer')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })
})
