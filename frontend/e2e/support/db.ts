import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') })

export async function deleteE2EBookings(marker: string): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set; cannot clean up e2e bookings')
  }
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query('BEGIN')
    await client.query(
      'DELETE FROM "reviews" WHERE "bookingId" IN (SELECT id FROM "bookings" WHERE description LIKE $1)',
      [`%${marker}%`],
    )
    await client.query(
      'DELETE FROM "payments" WHERE "bookingId" IN (SELECT id FROM "bookings" WHERE description LIKE $1)',
      [`%${marker}%`],
    )
    await client.query(
      'DELETE FROM "disputes" WHERE "bookingId" IN (SELECT id FROM "bookings" WHERE description LIKE $1)',
      [`%${marker}%`],
    )
    await client.query('DELETE FROM "bookings" WHERE description LIKE $1', [`%${marker}%`])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw err
  } finally {
    await client.end()
  }
}

export async function deleteE2EUsers(emailLike: string): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set; cannot clean up e2e users')
  }
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query('BEGIN')
    await client.query('DELETE FROM "refresh_tokens" WHERE "userId" IN (SELECT id FROM "users" WHERE email LIKE $1)', [
      `%${emailLike}%`,
    ])
    await client.query('DELETE FROM "users" WHERE email LIKE $1', [`%${emailLike}%`])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw err
  } finally {
    await client.end()
  }
}
