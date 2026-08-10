import { test, expect } from '@playwright/test'
import { createBookableArtisan, fillBookingDate } from './support/helpers'
import { deleteE2EUsers } from './support/db'

test.afterAll(async () => {
  await deleteE2EUsers('e2e.bookable.%').catch((e) => console.warn('e2e cleanup failed:', e.message))
})

async function getTopArtisan() {
  const res = await fetch('http://localhost:4000/api/artisans')
  if (!res.ok) throw new Error(`GET /api/artisans failed: ${res.status}`)
  const json = (await res.json()) as { data: Array<{ id: string; user: { name: string }; profession: string }> }
  if (!json.data || json.data.length === 0) throw new Error('No artisans returned by the API')
  return json.data[0]
}

test.describe('Browsing artisans', () => {
  test('search page lists artisans from the API', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByText('Emeka Okafor')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Pipe Installation').first()).toBeVisible()
    await expect(page.getByText('+1 more').first()).toBeVisible()
  })

  test('demo artisan profile shows the not-bookable notice', async ({ page }) => {
    const artisan = await getTopArtisan()
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await expect(page.getByText('Demo profile — not bookable').first()).toBeVisible()
    await expect(page.getByPlaceholder('Describe the job in detail...')).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Book via WhatsApp' })).toHaveCount(0)
  })

  test('artisan profile shows specialty skill badges derived from services', async ({ page }) => {
    const res = await fetch('http://localhost:4000/api/artisans?q=Emeka')
    const json = (await res.json()) as { data: Array<{ id: string; user: { name: string } }> }
    const emeka = json.data[0]
    await page.goto(`/artisans/${emeka.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(emeka.user.name, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Specialties' })).toBeVisible()
    await expect(page.getByText('Pipe Installation').first()).toBeVisible()
    await expect(page.getByText('Emergency Leak Repair').first()).toBeVisible()
    await expect(page.getByText('Drain Cleaning').first()).toBeVisible()
    await expect(page.getByText('Quick responder').first()).toBeVisible()
  })

  test('artisan profile shows real completed-job history', async ({ page }) => {
    const res = await fetch('http://localhost:4000/api/artisans?q=Chidi')
    const json = (await res.json()) as { data: Array<{ id: string; user: { name: string } }> }
    const chidi = json.data[0]
    await page.goto(`/artisans/${chidi.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(chidi.user.name, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Work History' })).toBeVisible()
    await expect(page.getByText('Build custom bookshelf').first()).toBeVisible()
    await expect(
      page.locator('div.bg-gray-50.rounded-xl', { hasText: 'Jobs Completed' }).getByText('1', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Quick responder')).toHaveCount(0)
  })

  test('bookable artisan profile shows details and the booking form', async ({ page }) => {
    const artisan = await createBookableArtisan()
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })
    await expect(page.getByText('Proceed to Book & Pay')).toBeVisible()
    await expect(page.getByPlaceholder('Describe the job in detail...')).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('bookable artisan profile offers WhatsApp booking with prefilled details', async ({ page }) => {
    const artisan = await createBookableArtisan()
    await page.goto(`/artisans/${artisan.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.user.name, { timeout: 20_000 })

    await fillBookingDate(page, '2030-01-15')
    await page.getByRole('combobox').selectOption({ label: '10:00 AM' })
    await page.getByPlaceholder('Describe the job in detail...').fill('Fix a leaking kitchen tap')

    const whatsapp = page.getByRole('link', { name: 'Book via WhatsApp' })
    await expect(whatsapp).toBeVisible()
    await expect(whatsapp).toHaveAttribute('href', /https:\/\/wa\.me\/2347012345678\?text=/)
    await expect(whatsapp).toHaveAttribute('href', /Date%3A%202030-01-15/)
    await expect(whatsapp).toHaveAttribute('href', /Time%3A%2010%3A00%20AM/)
    await expect(whatsapp).toHaveAttribute('href', /Fix%20a%20leaking%20kitchen%20tap/)
    const href = await whatsapp.getAttribute('href')
    expect(decodeURIComponent(href || '')).toContain('Hello')

    await expect(page.getByRole('link', { name: /Message/ }).first()).toHaveAttribute('href', href)
  })
})
