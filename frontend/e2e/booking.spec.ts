import { test, expect } from '@playwright/test'
import { deleteE2EBookings, deleteE2EUsers } from './support/db'
import { login, createBookableArtisan, fillBookingDate } from './support/helpers'

const MARKER = `E2E booking ${Date.now()}`
const API_URL = 'http://localhost:4000/api'

function futureDate(days = 45): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return d.toISOString().slice(0, 10)
}

async function topArtisan(): Promise<{ id: string; user: { id: string; name: string }; hourlyRate: number }> {
  const res = await fetch(`${API_URL}/artisans`)
  if (!res.ok) throw new Error(`GET /api/artisans failed: ${res.status}`)
  const json = (await res.json()) as { data: Array<{ id: string; user: { id: string; name: string }; hourlyRate: number }> }
  return json.data[0]
}

test.afterAll(async () => {
  await deleteE2EBookings(MARKER).catch((e) => console.warn('e2e cleanup failed:', e.message))
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

test.describe('Booking & payment', () => {
  test('books an artisan and pays through mock Paystack', async ({ page }) => {
    const artisan = await createBookableArtisan()

    await login(page)

    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await fillBookingDate(page, futureDate())
    await page.getByRole('combobox').selectOption({ label: '10:00 AM' })
    await page.getByPlaceholder('Describe the job in detail...').fill(`${MARKER} — install a kitchen tap`)
    await page.getByRole('button', { name: 'Proceed to Book & Pay' }).click()

    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })

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

    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible()
  })

  test('cancels a pending booking from booking history', async ({ page }) => {
    const artisan = await topArtisan()

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
        date: futureDate(55),
        time: '11:00 AM',
        description: `${MARKER} — cancel flow`,
        amount: 18000,
      },
    })
    expect(createRes.ok()).toBeTruthy()

    await page.goto('/bookings')
    const card = page
      .locator('div.bg-white.rounded-2xl', { hasText: artisan.user.name })
      .filter({ hasText: `${MARKER} — cancel flow` })
    await expect(card.getByRole('button', { name: 'Cancel Booking' })).toBeVisible({ timeout: 20_000 })
    await card.getByRole('button', { name: 'Cancel Booking' }).click()

    await page.getByRole('dialog').getByRole('button', { name: 'Yes, Cancel' }).click()
    await expect(card.getByText('Cancelled', { exact: true })).toBeVisible({ timeout: 20_000 })
  })

  test('raises a dispute on a confirmed booking', async ({ page }) => {
    const artisan = await topArtisan()
    const amount = 31000

    await login(page)

    const customerLogin = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'chisom@example.com', password: 'password123' },
    })
    expect(customerLogin.ok()).toBeTruthy()
    const { accessToken: customerToken } = (await customerLogin.json()) as { accessToken: string }

    const createRes = await page.request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        artisanId: artisan.id,
        date: futureDate(60),
        time: '3:00 PM',
        description: `${MARKER} — dispute flow`,
        amount,
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const bookingId = ((await createRes.json()) as { data: { id: string } }).data.id

    const initRes = await page.request.post(`${API_URL}/payments/initialize`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { bookingId },
    })
    expect(initRes.ok()).toBeTruthy()
    const { reference } = ((await initRes.json()) as { data: { reference: string } }).data
    const verifyRes = await page.request.get(`${API_URL}/payments/verify/${reference}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    expect(verifyRes.ok()).toBeTruthy()

    const artisanLogin = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: `${artisan.user.name.split(' ')[0].toLowerCase()}@example.com`, password: 'password123' },
    })
    expect(artisanLogin.ok()).toBeTruthy()
    const { accessToken: artisanToken } = (await artisanLogin.json()) as { accessToken: string }
    const confirmRes = await page.request.patch(`${API_URL}/bookings/${bookingId}/status`, {
      headers: { Authorization: `Bearer ${artisanToken}` },
      data: { status: 'CONFIRMED' },
    })
    expect(confirmRes.ok()).toBeTruthy()

    await page.goto('/bookings')
    const card = page
      .locator('div.bg-white.rounded-2xl', { hasText: artisan.user.name })
      .filter({ hasText: `${MARKER} — dispute flow` })
    await expect(card.getByRole('button', { name: 'Raise Dispute' })).toBeVisible({ timeout: 20_000 })
    await card.getByRole('button', { name: 'Raise Dispute' }).click()

    await page.getByRole('dialog').getByPlaceholder(/min 10 characters/).fill('Artisan never completed the agreed work properly')
    await page.getByRole('dialog').getByRole('button', { name: 'Submit Dispute' }).click()
    await expect(page.getByText('Dispute raised — our team will review it shortly.')).toBeVisible({ timeout: 20_000 })
  })
})
