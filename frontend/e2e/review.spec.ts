import { test, expect } from '@playwright/test'
import { deleteE2EBookings, deleteE2EUsers } from './support/db'
import { login, createBookableArtisan, fillBookingDate } from './support/helpers'

const MARKER = `E2E review ${Date.now()}`
const API_URL = 'http://localhost:4000/api'

// 1x1 transparent PNG
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

function futureDate(days = 45): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return d.toISOString().slice(0, 10)
}

async function artisanToken(email: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  })
  if (!res.ok) throw new Error(`Artisan login failed: ${res.status}`)
  return ((await res.json()) as { accessToken: string }).accessToken
}

test.afterAll(async () => {
  await deleteE2EBookings(MARKER).catch((e) => console.warn('e2e cleanup failed:', e.message))
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('Review with photo', () => {
  test('reviews a completed job with a photo and shows it on the public profile', async ({ page }) => {
    const artisan = await createBookableArtisan()

    await login(page)

    // Book and pay through mock Paystack, just like a real customer.
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await fillBookingDate(page, futureDate())
    await page.getByRole('combobox').selectOption({ label: '10:00 AM' })
    await page.getByPlaceholder('Describe the job in detail...').fill(`${MARKER} — paint a hallway`)
    await page.getByRole('button', { name: 'Proceed to Book & Pay' }).click()
    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })

    // The artisan confirms and completes the job, then the customer can review.
    const token = await artisanToken(artisan.email)
    const list = await fetch(`${API_URL}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
    if (!list.ok) throw new Error(`GET /api/bookings failed: ${list.status}`)
    const json = (await list.json()) as { data: Array<{ id: string; description: string | null }> }
    const booking = json.data.find((b) => b.description?.includes(MARKER))
    expect(booking).toBeTruthy()
    for (const status of ['CONFIRMED', 'COMPLETED']) {
      const res = await fetch(`${API_URL}/bookings/${booking!.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      expect(res.ok).toBeTruthy()
    }

    await page.goto('/bookings')
    const card = page.locator('div.bg-white.rounded-2xl', { hasText: MARKER })
    await expect(card.getByText('Completed')).toBeVisible({ timeout: 15_000 })
    await card.getByRole('button', { name: 'Leave Review' }).click()
    await expect(page.getByRole('dialog').getByText(artisan.user.name)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '5 stars' }).click()
    await page.getByLabel('Share your experience').fill(`${MARKER} — excellent work, very tidy.`)
    await page.locator('#review-photo').setInputFiles({
      name: 'work.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    })
    await expect(page.getByAltText('Review photo preview')).toBeVisible()
    await page.getByRole('button', { name: 'Submit Review' }).click()
    await expect(page.getByText('Thanks! Your review has been published.')).toBeVisible({ timeout: 15_000 })
    await expect(card.getByText('Reviewed')).toBeVisible({ timeout: 15_000 })

    // The public profile shows the photo review with the verified-buyer tag.
    await page.goto(`/artisans/${artisan.id}`)
    await page.getByRole('button', { name: 'Reviews' }).click()
    await expect(page.getByText('Verified buyer').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(`${MARKER} — excellent work, very tidy.`)).toBeVisible()
    await expect(page.locator('img[alt*="Work photo"]').first()).toBeVisible()
  })
})
