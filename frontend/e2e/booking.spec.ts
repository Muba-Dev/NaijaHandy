import { test, expect } from '@playwright/test'
import { deleteE2EBookings, deleteE2EUsers, addE2EService } from './support/db'
import { login, createBookableArtisan, fillBookingDate } from './support/helpers'

const MARKER = `E2E booking ${Date.now()}`
const API_URL = 'http://localhost:4000/api'

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
    await page.getByLabel('Time').selectOption({ label: '10:00 AM' })
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

  test('rebooks a completed artisan with pre-filled job details', async ({ page }) => {
    const artisan = await createBookableArtisan()

    await login(page)

    // First booking: book and pay through mock Paystack.
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await fillBookingDate(page, futureDate())
    await page.getByLabel('Time').selectOption({ label: '10:00 AM' })
    await page.getByPlaceholder('Describe the job in detail...').fill(`${MARKER} — rebook me`)
    await page.getByRole('button', { name: 'Proceed to Book & Pay' }).click()
    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })

    // The artisan completes the job.
    const token = await artisanToken(artisan.email)
    const list = await fetch(`${API_URL}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
    if (!list.ok) throw new Error(`GET /api/bookings failed: ${list.status}`)
    const json = (await list.json()) as { data: Array<{ id: string; description: string | null }> }
    const booking = json.data.find((b) => b.description?.includes(`${MARKER} — rebook me`))
    expect(booking).toBeTruthy()
    for (const status of ['CONFIRMED', 'COMPLETED']) {
      const res = await fetch(`${API_URL}/bookings/${booking!.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      expect(res.ok).toBeTruthy()
    }

    // The completed card offers "Book Again", which pre-fills the profile form.
    await page.goto('/bookings')
    const card = page.locator('div.bg-white.rounded-2xl', { hasText: `${MARKER} — rebook me` })
    await expect(card.getByText('Completed')).toBeVisible({ timeout: 15_000 })
    await card.getByRole('link', { name: 'Book Again' }).click()
    await expect(page).toHaveURL(/bookagain=1/, { timeout: 15_000 })

    await expect(page.getByText(/Rebooking/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('Time')).toHaveValue('10:00 AM')
    await expect(page.getByPlaceholder('Describe the job in detail...')).toHaveValue(`${MARKER} — rebook me`)
    await expect(page.locator('input[type="date"]')).not.toHaveValue('')

    // One tap re-books the same artisan.
    await page.getByRole('button', { name: 'Proceed to Book & Pay' }).click()
    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })
  })

  test('flags an urgent booking that shows a badge on both dashboards', async ({ browser }) => {
    test.setTimeout(150_000)
    const artisan = await createBookableArtisan()

    const customerCtx = await browser.newContext()
    const customerPage = await customerCtx.newPage()
    await login(customerPage)

    await customerPage.goto(`/artisans/${artisan.id}`)
    await expect(customerPage.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await fillBookingDate(customerPage, futureDate())
    await customerPage.getByLabel('Time').selectOption({ label: '9:00 AM' })
    await customerPage.getByPlaceholder('Describe the job in detail...').fill(`${MARKER} — urgent pipe job`)
    await customerPage.getByRole('checkbox', { name: /Urgent/ }).check()
    await customerPage.getByRole('button', { name: 'Proceed to Book & Pay' }).click()

    await expect(customerPage.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })

    // Customer sees the Urgent badge and can filter to it.
    await customerPage.goto('/bookings')
    const card = customerPage
      .locator('div.bg-white.rounded-2xl', { hasText: `${MARKER} — urgent pipe job` })
    await expect(card.getByText('Urgent', { exact: true })).toBeVisible({ timeout: 20_000 })
    await customerPage.getByRole('group', { name: 'Filter bookings' }).getByRole('button', { name: /Urgent/ }).click()
    await expect(card).toBeVisible()
    await customerCtx.close()

    // Artisan dashboard surfaces the urgent request too.
    const artisanCtx = await browser.newContext()
    const artisanPage = await artisanCtx.newPage()
    await artisanPage.goto('/login')
    await artisanPage.locator('main form input[type="email"]').fill(artisan.email)
    await artisanPage.locator('main form input[type="password"]').fill('password123')
    await artisanPage.getByRole('button', { name: 'Log In' }).click()
    await expect(artisanPage).toHaveURL(/\/dashboard\/artisan/, { timeout: 15_000 })
    await artisanPage.goto('/dashboard/artisan/requests')
    const request = artisanPage.locator('div.bg-white.rounded-2xl', { hasText: `${MARKER} — urgent pipe job` })
    await expect(request.getByText('Urgent', { exact: true })).toBeVisible({ timeout: 20_000 })
    await artisanCtx.close()
  })

  test('shows an upfront price estimate from service rates and charges it', async ({ page }) => {
    const artisan = await createBookableArtisan()
    await addE2EService(artisan.id, 'Full Home Painting', 15000)
    await addE2EService(artisan.id, 'Touch-up Painting', 8000)

    await login(page)
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })

    // Defaults to the first service at 2hrs → 15000×2 + 500 = 30500.
    await expect(page.getByLabel('Service')).toHaveValue('Full Home Painting')
    await expect(page.getByText('Full Home Painting (2hrs)')).toBeVisible()
    await expect(page.getByText('₦30,500')).toBeVisible()

    // Switching service re-prices the estimate → 8000×2 + 500 = 16500.
    await page.getByLabel('Service').selectOption({ value: 'Touch-up Painting' })
    await expect(page.getByText('₦16,500')).toBeVisible()

    // Shortening the duration re-prices again → 8000×1 + 500 = 8500.
    await page.getByLabel('Duration').selectOption({ value: '1' })
    await expect(page.getByText('₦8,500')).toBeVisible()

    // The customer is charged exactly the shown estimate.
    await fillBookingDate(page, futureDate())
    await page.getByLabel('Time').selectOption({ label: '11:00 AM' })
    await page.getByPlaceholder('Describe the job in detail...').fill(`${MARKER} — painting job`)
    await page.getByRole('button', { name: 'Proceed to Book & Pay' }).click()
    await expect(page.getByText('Payment successful — your booking is now paid.')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('₦8,500').first()).toBeVisible()
  })
})
