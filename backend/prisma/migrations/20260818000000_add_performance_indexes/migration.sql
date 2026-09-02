-- Add database indexes for frequently queried columns identified in the
-- performance audit. All statements are idempotent (IF NOT EXISTS) so they
-- remain safe to apply alongside the older startup safety net in main.ts.

-- users: filtered by role + status in admin listUsers, by city in user lookup
CREATE INDEX IF NOT EXISTS "users_role_status_idx" ON "users"("role", "status");
CREATE INDEX IF NOT EXISTS "users_city_idx" ON "users"("city");

-- refresh_tokens: revoke-all-on-delete scans by userId
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- password_reset_tokens: cleanup scans by userId
CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- artisan_profiles: filtered by category + approvalStatus in catalogue/search,
-- by profession in keyword search, by approvalStatus + available in homepage
CREATE INDEX IF NOT EXISTS "artisan_profiles_category_approvalStatus_idx" ON "artisan_profiles"("category", "approvalStatus");
CREATE INDEX IF NOT EXISTS "artisan_profiles_profession_idx" ON "artisan_profiles"("profession");
CREATE INDEX IF NOT EXISTS "artisan_profiles_approvalStatus_available_idx" ON "artisan_profiles"("approvalStatus", "available");
CREATE INDEX IF NOT EXISTS "artisan_profiles_approvalStatus_idx" ON "artisan_profiles"("approvalStatus");

-- services / portfolio_items: nested lookups by artisanId
CREATE INDEX IF NOT EXISTS "services_artisanId_idx" ON "services"("artisanId");
CREATE INDEX IF NOT EXISTS "portfolio_items_artisanId_idx" ON "portfolio_items"("artisanId");

-- bookings: list endpoints filter by customer/artisan + status
CREATE INDEX IF NOT EXISTS "bookings_customerId_status_idx" ON "bookings"("customerId", "status");
CREATE INDEX IF NOT EXISTS "bookings_artisanId_status_idx" ON "bookings"("artisanId", "status");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");

-- payments: admin stats aggregate on status and escrowStatus
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_escrowStatus_idx" ON "payments"("escrowStatus");

-- reviews: admin moderation by status, artisan/profile lookup by artisanId/customerId
CREATE INDEX IF NOT EXISTS "reviews_customerId_idx" ON "reviews"("customerId");
CREATE INDEX IF NOT EXISTS "reviews_artisanId_idx" ON "reviews"("artisanId");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");

-- disputes: listing by status, open-dispute check by bookingId + status
CREATE INDEX IF NOT EXISTS "disputes_bookingId_status_idx" ON "disputes"("bookingId", "status");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");