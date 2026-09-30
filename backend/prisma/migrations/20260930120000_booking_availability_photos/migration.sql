ALTER TABLE "bookings"
ADD COLUMN "jobPhotoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "bookings_artisan_date_active_idx"
ON "bookings" ("artisanId", "date", "time")
WHERE "status" IN ('PENDING', 'CONFIRMED');