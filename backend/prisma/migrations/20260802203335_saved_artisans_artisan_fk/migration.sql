-- AddForeignKey
ALTER TABLE "saved_artisans" ADD CONSTRAINT "saved_artisans_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisan_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
