import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:4000/api'

// 1x1 transparent PNG
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('ID verification', () => {
  test('artisan submits an ID document and the admin approval shows on the public profile', async ({ page }) => {
    const email = `e2e.verify.${Date.now()}@example.com`
    const name = `E2E Verify ${Date.now()}`

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
    expect(reg.ok).toBeTruthy()
    const { accessToken } = (await reg.json()) as { accessToken: string }

    const me = await fetch(`${API_URL}/artisans/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
    expect(me.ok).toBeTruthy()
    const profile = ((await me.json()) as { data: { id: string } }).data

    const admin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@naijahandy.com', password: 'password123' }),
    })
    expect(admin.ok).toBeTruthy()
    const { accessToken: adminToken } = (await admin.json()) as { accessToken: string }

    const approve = await fetch(`${API_URL}/admin/artisans/${profile.id}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ approvalStatus: 'APPROVED' }),
    })
    expect(approve.ok).toBeTruthy()

    await page.goto('/login')
    await page.locator('main form input[type="email"]').fill(email)
    await page.locator('main form input[type="password"]').fill('password123')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveURL(/\/dashboard\/artisan/, { timeout: 20_000 })

    await page.goto('/dashboard/artisan/profile')
    await expect(page.getByRole('heading', { name: /ID Verification/ })).toBeVisible()
    await expect(page.getByText('Not submitted')).toBeVisible()

    await page.locator('#verification-upload').setInputFiles({
      name: 'id-card.png',
      mimeType: 'image/png',
      buffer: PNG_BYTES,
    })
    await page.getByRole('button', { name: 'Submit for review' }).click()
    await expect(page.getByText('Pending review')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Your document is being reviewed/)).toBeVisible()

    const reject = await fetch(`${API_URL}/admin/artisans/${profile.id}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ verificationStatus: 'REJECTED' }),
    })
    expect(reject.ok).toBeTruthy()

    await page.reload()
    await expect(page.getByText('Rejected', { exact: true })).toBeVisible()
    await expect(page.getByText(/Your previous document was rejected/)).toBeVisible()

    const verify = await fetch(`${API_URL}/admin/artisans/${profile.id}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ verificationStatus: 'VERIFIED' }),
    })
    expect(verify.ok).toBeTruthy()

    await page.reload()
    await expect(page.getByText('Verified')).toBeVisible()

    const publicRes = await fetch(`${API_URL}/artisans/${profile.id}`)
    expect(publicRes.ok).toBeTruthy()
    const publicProfile = (await publicRes.json()) as {
      data: { verified: boolean; verificationStatus: string; verificationDocUrl?: unknown }
    }
    expect(publicProfile.data.verified).toBe(true)
    expect(publicProfile.data.verificationStatus).toBe('VERIFIED')
    expect(publicProfile.data.verificationDocUrl).toBeUndefined()

    await page.goto(`/artisans/${profile.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name, { timeout: 20_000 })
    await expect(page.getByText('Verified Artisan')).toBeVisible()
  })
})
