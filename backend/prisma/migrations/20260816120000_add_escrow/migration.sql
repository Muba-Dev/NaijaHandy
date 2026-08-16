-- Escrow: a captured payment is HELD until the job is completed (then RELEASED
-- to the artisan) or cancelled / an upheld dispute refunds it (REFUNDED).

-- AddColumns
ALTER TABLE "payments"
    ADD COLUMN "escrowStatus" TEXT NOT NULL DEFAULT 'HELD',
    ADD COLUMN "escrowHeldAt" TIMESTAMP(3),
    ADD COLUMN "escrowReleasedAt" TIMESTAMP(3),
    ADD COLUMN "escrowRefundedAt" TIMESTAMP(3),
    ADD COLUMN "payoutAmount" INTEGER;

-- Backfill: payments captured before escrow existed are treated as already
-- released to the artisan (payout = gross minus the flat platform fee).
UPDATE "payments"
SET "escrowStatus" = 'RELEASED',
    "escrowReleasedAt" = COALESCE("paidAt", NOW()),
    "payoutAmount" = GREATEST("grossAmount" - 500, 0)
WHERE "status" = 'SUCCESS' AND "escrowStatus" = 'HELD';
