import { test, expect, type Page } from '@playwright/test'
import { deleteE2EBookings, deleteE2EUsers } from './support/db'
import { createBookableArtisan } from './support/helpers'

const MARKER = `E2E dashboard ${Date.now()}`
const API_URL = 'http://localhost:4000/api'

function futureDate(days = 45): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return d.toISOString().slice(0, 10)
}

test.afterAll(async () => {
  await deleteE2EBookings(MARKER).catch((e) => console.warn('e2e cleanup failed:', e.message))
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

async function loginAsArtisan(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.locator('main form input[type="email"]').fill(email)
  await page.locator('main form input[type="password"]').fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/\/dashboard\/artisan/, { timeout: 30_000 })
}

async function customerToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chisom@example.com', password: 'password123' }),
  })
  if (!res.ok) throw new Error(`Customer login failed: ${res.status}`)
  const { accessToken } = (await res.json()) as { accessToken: string }
  return accessToken
}

test.describe('New dashboard work', () => {
  test('booking request creates a notification with a working deep link', async ({ page }) => {
    const artisan = await createBookableArtisan()

    const token = await customerToken()
    const booking = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        artisanId: artisan.id,
        date: futureDate(),
        time: '10:00 AM',
        description: `${MARKER} — notification flow`,
        amount: 17000,
      }),
    })
    expect(booking.ok).toBeTruthy()

    await loginAsArtisan(page, artisan.email)
    await expect(page.getByRole('link', { name: /Notifications \(\d+ unread\)/ })).toBeVisible({ timeout: 20_000 })

    await page.goto('/notifications')
    const bookingNotif = page.getByRole('button', { name: /New booking request You have/ })
    await expect(bookingNotif).toBeVisible({ timeout: 20_000 })

    await bookingNotif.click()
    await expect(page).toHaveURL(/\/dashboard\/artisan\/requests/, { timeout: 15_000 })
    await expect(page.getByText(`${MARKER} — notification flow`)).toBeVisible({ timeout: 15_000 })
  })

  test('artisan uploads a cover photo and a portfolio item', async ({ page }) => {
    const artisan = await createBookableArtisan()
    await loginAsArtisan(page, artisan.email)

    await page.goto('/dashboard/artisan/profile')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My Profile', { timeout: 20_000 })

    await page.locator('#cover-upload').setInputFiles('e2e/fixtures/avatar.png')
    await page.getByRole('button', { name: 'Upload Cover' }).click()
    await expect(page.getByText('Cover photo updated.')).toBeVisible({ timeout: 20_000 })
    await expect
      .poll(
        async () => await page.locator('img[alt="Profile cover preview"]').getAttribute('src'),
        { timeout: 20_000 },
      )
      .toMatch(/^data:image/)

    await page.locator('#portfolio-caption').fill('Kitchen repaint in Ikeja')
    await page.locator('#portfolio-upload').setInputFiles('e2e/fixtures/avatar.png')
    await expect(page.getByText('Photo added to your portfolio.')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('img[alt="Kitchen repaint in Ikeja"]')).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: 'Delete portfolio photo: Kitchen repaint in Ikeja' }).click()
    await expect(page.getByRole('button', { name: 'Delete portfolio photo: Kitchen repaint in Ikeja' })).toHaveCount(0)
  })

  test('artisan saves a location and it shows on the public profile', async ({ page }) => {
    const artisan = await createBookableArtisan()
    await loginAsArtisan(page, artisan.email)

    await page.goto('/dashboard/artisan/profile')
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Save Location' })).toBeVisible()

    const map = page.locator('.leaflet-container').first()
    await expect(map).toBeVisible({ timeout: 20_000 })
    await map.click()

    await page.getByPlaceholder('Search address, street or area…').fill('Lagos Mainland')
    await page.getByRole('button', { name: 'Save Location' }).click()
    await expect(page.getByText('Location saved.')).toBeVisible({ timeout: 20_000 })

    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await expect(page.getByText('Lagos Mainland')).toBeVisible()
    await expect(page.getByRole('link', { name: /Open in Google Maps/ })).toBeVisible()
    await expect(page.locator('.leaflet-container').first()).toBeVisible()
  })
})
