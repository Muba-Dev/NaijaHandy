-- Add `confirmedAt` to bookings to anchor the customer cancellation grace
-- window. Set when an artisan confirms a booking; NULL until then (and for
-- legacy rows confirmed before this migration — treated as within-grace).

ALTER TABLE "bookings" ADD COLUMN "confirmedAt" TIMESTAMP(3);
