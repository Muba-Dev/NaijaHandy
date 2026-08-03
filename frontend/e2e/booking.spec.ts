import { test, expect } from '@playwright/test'
import { deleteE2EBookings } from './support/db'
import { login } from './support/helpers'

const MARKER = `E2E booking ${Date.now()}`
const API_URL = 'http://localhost:4000/api'

function futureDate(days = 45): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return d.toISOString().slice(0, 10)
}

async function topArtisan(): Promise<{ id: string; user: { name: string }; hourlyRate: number }> {
  const res = await fetch(`${API_URL}/artisans`)
  if (!res.ok) throw new Error(`GET /api/artisans failed: ${res.status}`)
  const json = (await res.json()) as { data: Array<{ id: string; user: { name: string }; hourlyRate: number }> }
  return json.data[0]
}

test.afterAll(async () => {
  await deleteE2EBookings(MARKER).catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('Booking & payment', () => {
  test('books an artisan and pays through mock Paystack', async ({ page }) => {
    const artisan = await topArtisan()

    await login(page)

    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await page.locator('input[type="date"]').fill(futureDate())
    await page.getByRole('combobox').selectOption({ label: '10:00 AM' })
    await page.getByPlaceholder('Describe the job in detail...').fill(`${MARKER} — install a kitchen tap`)
    await page.getByRole('button', { name: 'Proceed to Book & Pay' }).click()

    await expect(page).toHaveURL(/\/bookings\?reference=/, { timeout: 25_000 })
    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 25_000 })

    const expectedAmount = `₦${(artisan.hourlyRate * 2 + 500).toLocaleString('en-NG')}`
    await expect(page.getByText(expectedAmount).first()).toBeVisible()
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible()
  })

  test('pays for an unpaid booking with the Pay Now button', async ({ page }) => {
    const artisan = await topArtisan()
    const amount = 27000

    await login(page)

    const loginRes = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'chisom@example.com', password: 'password123' },
    })
    expect(loginRes.ok()).toBeTruthy()
    const { accessToken } = (await loginRes.json()) as { accessToken: string }

    const createRes = await page.request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        artisanId: artisan.id,
        date: futureDate(50),
        time: '2:00 PM',
        description: `${MARKER} — Pay Now button flow`,
        amount,
      },
    })
    expect(createRes.ok()).toBeTruthy()

    await page.goto('/bookings')
    const card = page
      .locator('div.bg-white.rounded-2xl', { hasText: artisan.user.name })
      .filter({ hasText: `₦${amount.toLocaleString('en-NG')}` })
    await expect(card.getByRole('button', { name: 'Pay Now' })).toBeVisible({ timeout: 20_000 })
    await card.getByRole('button', { name: 'Pay Now' }).first().click()

    await expect(page).toHaveURL(/\/bookings\?reference=/, { timeout: 25_000 })
    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible()
  })
})
