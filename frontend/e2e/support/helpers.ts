import { expect, type Page } from '@playwright/test'

export const CUSTOMER_EMAIL = 'chisom@example.com'
export const CUSTOMER_PASSWORD = 'password123'

const API_URL = 'http://localhost:4000/api'

export async function login(
  page: Page,
  email = CUSTOMER_EMAIL,
  password = CUSTOMER_PASSWORD,
): Promise<void> {
  await page.goto('/login')
  await page.locator('main form input[type="email"]').fill(email)
  await page.locator('main form input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/\/dashboard\/customer/, { timeout: 15_000 })
}

// React 19's controlled date input doesn't reliably pick up Playwright's
// programmatic fill(), so type the digits the way a real user would.
export async function fillBookingDate(page: Page, date: string): Promise<void> {
  const input = page.locator('input[type="date"]')
  await input.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(`${date.slice(5, 7)}${date.slice(8, 10)}${date.slice(0, 4)}`)
  await expect(input).toHaveValue(date)
}

// Registered artisans start as non-demo (isDemo=false) but PENDING approval, so
// they are hidden from public browsing. This helper registers one and has the
// seeded admin approve it, returning a fully bookable profile.
export async function createBookableArtisan(): Promise<{
  id: string
  user: { id: string; name: string }
  hourlyRate: number
  email: string
}> {
  const email = `e2e.bookable.${Date.now()}@example.com`
  const name = `E2E Bookable ${Date.now()}`
  const reg = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password: 'password123',
      role: 'ARTISAN',
      profession: 'Testing & QA',
      category: 'Other',
      phone: '+234 701 234 5678',
    }),
  })
  if (!reg.ok) throw new Error(`Registering an artisan failed: ${reg.status}`)
  const { accessToken } = (await reg.json()) as { accessToken: string }

  const me = await fetch(`${API_URL}/artisans/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!me.ok) throw new Error('Failed to load the new artisan profile')
  const profile = ((await me.json()) as { data: { id: string } }).data

  const admin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@naijahandy.com', password: 'password123' }),
  })
  if (!admin.ok) throw new Error('Admin login failed')
  const { accessToken: adminToken } = (await admin.json()) as { accessToken: string }

  const approve = await fetch(`${API_URL}/admin/artisans/${profile.id}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ approvalStatus: 'APPROVED' }),
  })
  if (!approve.ok) throw new Error(`Approving artisan failed: ${approve.status}`)

  return { id: profile.id, user: { id: profile.id, name }, hourlyRate: 0, email }
}
