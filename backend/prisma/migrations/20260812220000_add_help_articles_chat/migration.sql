-- Help Centre articles + AI support assistant (Phase 2)
-- pgvector is a Supabase-supported extension; the embedding column needs it.

CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "help_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_chat_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "articleIds" TEXT,
    "confidence" DOUBLE PRECISION,
    "model" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");

-- CreateIndex
CREATE INDEX "help_articles_category_idx" ON "help_articles"("category");

-- CreateIndex
CREATE INDEX "support_chat_logs_createdAt_idx" ON "support_chat_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "support_chat_logs" ADD CONSTRAINT "support_chat_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the Help Centre articles (single source of truth; prod never seeds, so
-- the corpus ships with this migration). Embeddings are generated separately
-- via POST /api/help/articles/embed or `npm run db:embed-help`.

INSERT INTO "help_articles" ("id", "slug", "category", "title", "content", "order") VALUES
('cla_gs_book', 'how-to-book-an-artisan', 'Getting started', 'How do I book an artisan?', 'Search or browse for an artisan, open their profile, choose a date and time, and describe the job. Use "Send Instant Request" to ask them to get in touch for free, or "Proceed to Book & Pay" to see a price estimate and pay securely through Paystack.', 1),
('cla_gs_account', 'do-i-need-an-account', 'Getting started', 'Do I need an account to book?', 'Yes. Registering lets you send booking requests, pay, save artisans, and rebook later. Your phone number and job address are saved so booking again is one tap.', 2),
('cla_gs_req_vs_pay', 'instant-request-vs-book-and-pay', 'Getting started', 'What is the difference between "Send Instant Request" and "Proceed to Book & Pay"?', 'An instant request is free. It notifies the artisan with your contact details so they can reach you directly. "Proceed to Book & Pay" shows a price estimate and takes you through checkout; your booking is confirmed once payment succeeds.', 3),
('cla_gs_find', 'how-do-i-find-an-artisan', 'Getting started', 'How do I find the right artisan?', 'Use the search page to filter by profession, city, price range, minimum rating, and distance from you. Verified artisans carry a badge, and every profile shows reviews, completed-job history, and skill badges. You can message an artisan on WhatsApp before you book.', 4),
('cla_bp_pay', 'how-do-payments-work', 'Booking & payments', 'How do payments work?', 'Checkout is handled by Paystack. You can pay with card, bank transfer, or USSD. Your booking is confirmed once the payment succeeds, and both you and the artisan get a notification.', 1),
('cla_bp_fee', 'why-is-there-a-platform-fee', 'Booking & payments', 'Why is there a platform fee?', 'The price estimate shows the artisan rate plus a small platform fee. The fee keeps NaijaHandy running: matching, verification, and support. You always see the full estimate before you pay.', 2),
('cla_bp_cancel', 'can-i-cancel-a-booking', 'Booking & payments', 'Can I cancel a booking?', 'Yes. Open your booking from the Bookings page and cancel it. If you already paid, contact us from the Help Centre and we will help you sort out a refund.', 3),
('cla_bp_instant_free', 'is-an-instant-request-charged', 'Booking & payments', 'Will I be charged for an instant request?', 'No. Instant requests are free. You only pay when you complete checkout for a booking.', 4),
('cla_bp_refund', 'how-are-refunds-handled', 'Booking & payments', 'How are refunds handled?', 'If a paid booking is cancelled or the job is not done as agreed, raise the issue with the artisan first, then open a dispute from the booking within 14 days of the job date. NaijaHandy reviews the evidence and, where the guarantee applies, arranges a refund or a rework.', 5),
('cla_bp_rebook', 'how-does-book-again-work', 'Booking & payments', 'How do I book the same artisan again?', 'Completed bookings on your Bookings page have a "Book Again" button. It opens the artisan profile with the previous time and job description prefilled, so rehiring a trusted artisan takes one tap.', 6),
('cla_ts_verified', 'how-do-i-know-an-artisan-is-verified', 'Trust & safety', 'How do I know an artisan is verified?', 'Artisans who pass ID verification carry a verified badge on their profile. You can also read reviews and check each profile completed-job history before booking.', 1),
('cla_ts_reviews', 'are-reviews-moderated', 'Trust & safety', 'Are reviews moderated?', 'Yes. Reviews are checked and hidden if they break our guidelines, so what you see reflects real completed work. Reviews only come from completed bookings and carry a "Verified buyer" tag.', 2),
('cla_ts_id', 'what-is-id-verification', 'Trust & safety', 'What is ID verification?', 'Artisans can submit an ID document from their profile. Our team reviews it, and once approved the artisan carries a verified badge. Submitted documents are never shown publicly.', 3),
('cla_dg_guarantee', 'what-is-the-naijahandy-guarantee', 'Disputes & guarantee', 'What is the NaijaHandy Guarantee?', 'Paid bookings are protected by the NaijaHandy Guarantee: if the job is not done right, we work to make it right with a refund or a rework. Claims must be raised within 14 days of the job date. Read the full policy on the Service Guarantee page.', 1),
('cla_dg_goeswrong', 'what-if-something-goes-wrong', 'Disputes & guarantee', 'What if something goes wrong with a job?', 'From your booking you can raise a dispute and our team will review it. Paid bookings are covered by the NaijaHandy Guarantee, and claims raised within 14 days of the job date are eligible for a refund or rework.', 2),
('cla_dg_dispute', 'how-do-i-raise-a-dispute', 'Disputes & guarantee', 'How do I raise a dispute?', 'Open the booking from your Bookings page and choose "Raise a dispute", then explain the problem. Keep messages and photos as evidence. Claims must be raised within 14 days of the job date for the guarantee to apply.', 3),
('cla_ar_requests', 'how-do-i-receive-booking-requests', 'For artisans', 'How do I receive booking requests?', 'New requests appear in your artisan dashboard where you can accept or decline them. You will also be notified by email and in-app. Urgent requests appear at the top and are marked with an Urgent badge.', 1),
('cla_ar_verified', 'how-do-i-get-the-verified-badge', 'For artisans', 'How do I get the verified badge?', 'Submit an ID document from your artisan profile. Our team reviews it, and once approved you will carry the verified badge on your profile.', 2),
('cla_ar_payout', 'how-do-artisans-get-paid', 'For artisans', 'How do artisans get paid?', 'Customers pay securely through Paystack when they check out. When a booking is paid you get a PAYMENT_RECEIVED notification, and completing the job moves it into your completed history, which builds trust and attracts more bookings.', 3),
('cla_ar_urgent', 'what-is-an-urgent-request', 'For artisans', 'What is an urgent request?', 'Urgent requests are same-day jobs customers flagged as time-sensitive. They are sorted to the top of your job requests and marked with an Urgent badge so you can spot them quickly. Accepting them is just like any other request.', 4);
