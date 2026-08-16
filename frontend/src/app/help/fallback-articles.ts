import type { HelpArticleGroup } from '@/types'

// Static copy of the Help Centre corpus. Shown when the API is unreachable or
// the articles have not been seeded (e.g. a freshly migrated database), so the
// Help page is never an empty shell.
export const FALLBACK_SECTIONS: HelpArticleGroup[] = [
  {
    category: 'Getting started',
    items: [
      {
        slug: 'how-to-book-an-artisan',
        title: 'How do I book an artisan?',
        content:
          'Search or browse for an artisan, open their profile, choose a date and time, and describe the job. Use "Send Instant Request" to ask them to get in touch for free, or "Proceed to Book & Pay" to see a price estimate and pay securely through Paystack.',
      },
      {
        slug: 'do-i-need-an-account',
        title: 'Do I need an account to book?',
        content:
          'Yes. Registering lets you send booking requests, pay, save artisans, and rebook later. Your phone number and job address are saved so booking again is one tap.',
      },
      {
        slug: 'instant-request-vs-book-and-pay',
        title: 'What is the difference between "Send Instant Request" and "Proceed to Book & Pay"?',
        content:
          'An instant request is free. It notifies the artisan with your contact details so they can reach you directly. "Proceed to Book & Pay" shows a price estimate and takes you through checkout; your booking is confirmed once payment succeeds.',
      },
      {
        slug: 'how-do-i-find-an-artisan',
        title: 'How do I find the right artisan?',
        content:
          'Use the search page to filter by profession, city, price range, minimum rating, and distance from you. Verified artisans carry a badge, and every profile shows reviews, completed-job history, and skill badges. You can message an artisan on WhatsApp before you book.',
      },
    ],
  },
  {
    category: 'Booking & payments',
    items: [
      {
        slug: 'how-do-payments-work',
        title: 'How do payments work?',
        content:
          'Checkout is handled by Paystack. You can pay with card, bank transfer, or USSD. Your booking is confirmed once the payment succeeds, and both you and the artisan get a notification.',
      },
      {
        slug: 'why-is-there-a-platform-fee',
        title: 'Why is there a platform fee?',
        content:
          'The price estimate shows the artisan rate plus a small platform fee. The fee keeps NaijaHandy running: matching, verification, and support. You always see the full estimate before you pay.',
      },
      {
        slug: 'can-i-cancel-a-booking',
        title: 'Can I cancel a booking?',
        content:
          'Yes. Open your booking from the Bookings page and cancel it. If you already paid, contact us from the Help Centre and we will help you sort out a refund.',
      },
      {
        slug: 'is-an-instant-request-charged',
        title: 'Will I be charged for an instant request?',
        content: 'No. Instant requests are free. You only pay when you complete checkout for a booking.',
      },
      {
        slug: 'how-are-refunds-handled',
        title: 'How are refunds handled?',
        content:
          'If a paid booking is cancelled or the job is not done as agreed, raise the issue with the artisan first, then open a dispute from the booking within 14 days of the job date. NaijaHandy reviews the evidence and, where the guarantee applies, arranges a refund or a rework.',
      },
      {
        slug: 'how-does-book-again-work',
        title: 'How do I book the same artisan again?',
        content:
          'Completed bookings on your Bookings page have a "Book Again" button. It opens the artisan profile with the previous time and job description prefilled, so rehiring a trusted artisan takes one tap.',
      },
    ],
  },
  {
    category: 'Trust & safety',
    items: [
      {
        slug: 'how-do-i-know-an-artisan-is-verified',
        title: 'How do I know an artisan is verified?',
        content:
          'Artisans who pass ID verification carry a verified badge on their profile. You can also read reviews and check each profile completed-job history before booking.',
      },
      {
        slug: 'are-reviews-moderated',
        title: 'Are reviews moderated?',
        content:
          'Yes. Reviews are checked and hidden if they break our guidelines, so what you see reflects real completed work. Reviews only come from completed bookings and carry a "Verified buyer" tag.',
      },
      {
        slug: 'what-is-id-verification',
        title: 'What is ID verification?',
        content:
          'Artisans can submit an ID document from their profile. Our team reviews it, and once approved the artisan carries a verified badge. Submitted documents are never shown publicly.',
      },
    ],
  },
  {
    category: 'Disputes & guarantee',
    items: [
      {
        slug: 'what-is-the-naijahandy-guarantee',
        title: 'What is the NaijaHandy Guarantee?',
        content:
          'Paid bookings are protected by the NaijaHandy Guarantee: if the job is not done right, we work to make it right with a refund or a rework. Claims must be raised within 14 days of the job date. Read the full policy on the Service Guarantee page.',
      },
      {
        slug: 'what-if-something-goes-wrong',
        title: 'What if something goes wrong with a job?',
        content:
          'From your booking you can raise a dispute and our team will review it. Paid bookings are covered by the NaijaHandy Guarantee, and claims raised within 14 days of the job date are eligible for a refund or rework.',
      },
      {
        slug: 'how-do-i-raise-a-dispute',
        title: 'How do I raise a dispute?',
        content:
          'Open the booking from your Bookings page and choose "Raise a dispute", then explain the problem. Keep messages and photos as evidence. Claims must be raised within 14 days of the job date for the guarantee to apply.',
      },
    ],
  },
  {
    category: 'For artisans',
    items: [
      {
        slug: 'how-do-i-receive-booking-requests',
        title: 'How do I receive booking requests?',
        content:
          'New requests appear in your artisan dashboard where you can accept or decline them. You will also be notified by email and in-app. Urgent requests appear at the top and are marked with an Urgent badge.',
      },
      {
        slug: 'how-do-i-get-the-verified-badge',
        title: 'How do I get the verified badge?',
        content:
          'Submit an ID document from your artisan profile. Our team reviews it, and once approved you will carry the verified badge on your profile.',
      },
      {
        slug: 'how-do-artisans-get-paid',
        title: 'How do artisans get paid?',
        content:
          'Customers pay securely through Paystack when they check out. When a booking is paid you get a PAYMENT_RECEIVED notification, and completing the job moves it into your completed history, which builds trust and attracts more bookings.',
      },
      {
        slug: 'what-is-an-urgent-request',
        title: 'What is an urgent request?',
        content:
          'Urgent requests are same-day jobs customers flagged as time-sensitive. They are sorted to the top of your job requests and marked with an Urgent badge so you can spot them quickly. Accepting them is just like any other request.',
      },
    ],
  },
]
