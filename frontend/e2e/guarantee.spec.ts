import { test, expect } from '@playwright/test'

test.describe('Service Guarantee', () => {
  test('guarantee page explains coverage and how to claim', async ({ page }) => {
    await page.goto('/guarantee')
    await expect(page.getByRole('heading', { level: 1, name: 'Book with confidence.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /What.s covered/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /What.s not covered/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How to claim' })).toBeVisible()
    await expect(page.getByText(/14 days/).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Review your bookings' })).toHaveAttribute('href', '/bookings')
  })

  test('footer links to the service guarantee page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Platform' }).getByRole('link', { name: 'Service Guarantee' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Book with confidence.' })).toBeVisible()
  })
})
