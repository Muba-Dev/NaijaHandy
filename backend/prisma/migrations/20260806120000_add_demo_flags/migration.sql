-- AlterTable
ALTER TABLE "users" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "artisan_profiles" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
