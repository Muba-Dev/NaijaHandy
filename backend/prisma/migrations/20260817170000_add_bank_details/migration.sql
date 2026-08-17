-- Add bank details columns to users for artisan payouts and customer payment info

ALTER TABLE "users" ADD COLUMN "bankName" TEXT;
ALTER TABLE "users" ADD COLUMN "bankAccountNumber" TEXT;
ALTER TABLE "users" ADD COLUMN "bankAccountName" TEXT;
