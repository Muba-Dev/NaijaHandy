-- Customer loyalty credits + payment accounting (gross vs charged)

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "bookingId" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "creditBalance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "creditsApplied" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "payments" ADD COLUMN "grossAmount" INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing payments were always charged the full booking amount.
UPDATE "payments" SET "grossAmount" = "amount" WHERE "grossAmount" = 0;

-- grossAmount is always set explicitly by the app; drop the temporary default.
ALTER TABLE "payments" ALTER COLUMN "grossAmount" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
