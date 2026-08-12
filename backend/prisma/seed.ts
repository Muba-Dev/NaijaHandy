import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Demo labeling: SEED_DEMO=0 disables demo flags (safe for production).
const SEED_DEMO = process.env.SEED_DEMO !== '0' && process.env.SEED_DEMO !== 'false'

function ensureDatabaseMigrated(): void {
  console.log('Checking database migrations…')
  try {
    execSync('npx prisma migrate status', { stdio: 'inherit' })
  } catch {
    console.error('\n[seed] ERROR: Database is missing pending migrations.')
    console.error('[seed] Run `npm run db:deploy` (or `npx prisma migrate deploy`) first, then retry.\n')
    process.exit(1)
  }
}

const AVATARS: Record<string, string> = {
  emeka: 'https://images.pexels.com/photos/35533370/pexels-photo-35533370.jpeg?auto=compress&cs=tinysrgb&w=800',
  fatima: 'https://images.pexels.com/photos/38180101/pexels-photo-38180101.jpeg?auto=compress&cs=tinysrgb&w=800',
  chidi: 'https://images.pexels.com/photos/35730557/pexels-photo-35730557.jpeg?auto=compress&cs=tinysrgb&w=800',
  amaka: 'https://images.pexels.com/photos/36845523/pexels-photo-36845523.jpeg?auto=compress&cs=tinysrgb&w=800',
  yusuf: 'https://images.pexels.com/photos/33242998/pexels-photo-33242998.jpeg?auto=compress&cs=tinysrgb&w=800',
  ngozi: 'https://images.pexels.com/photos/32463149/pexels-photo-32463149.jpeg?auto=compress&cs=tinysrgb&w=800',
  musa: 'https://images.pexels.com/photos/32757396/pexels-photo-32757396.jpeg?auto=compress&cs=tinysrgb&w=800',
  adaeze: 'https://images.pexels.com/photos/38250933/pexels-photo-38250933.jpeg?auto=compress&cs=tinysrgb&w=800',
  tunde: 'https://images.pexels.com/photos/36029380/pexels-photo-36029380.jpeg?auto=compress&cs=tinysrgb&w=800',
  halima: 'https://images.pexels.com/photos/37347157/pexels-photo-37347157.jpeg?auto=compress&cs=tinysrgb&w=800',
}

type ArtisanSeed = {
  key: string
  name: string
  email: string
  phone: string
  city: string
  profession: string
  category: string
  bio: string
  hourlyRate: number
  verified: boolean
  available: boolean
  avgRating: number
  totalReviews: number
}

const ARTISANS: ArtisanSeed[] = [
  {
    key: 'emeka', name: 'Emeka Okafor', email: 'emeka@example.com', phone: '+234 801 234 5678', city: 'Lagos, VI',
    profession: 'Master Plumber', category: 'Plumbing',
    bio: 'Over 12 years of experience fixing residential and commercial plumbing across Lagos. Specialise in pipe installations and emergency repairs.',
    hourlyRate: 8500, verified: true, available: true, avgRating: 4.9, totalReviews: 134,
  },
  {
    key: 'fatima', name: 'Fatima Aliyu', email: 'fatima@example.com', phone: '+234 802 345 6780', city: 'Abuja, Wuse',
    profession: 'Electrician', category: 'Electrical',
    bio: 'Certified electrical engineer with COREN accreditation. Residential wiring, industrial installations, and solar panel setups.',
    hourlyRate: 7500, verified: true, available: true, avgRating: 4.8, totalReviews: 89,
  },
  {
    key: 'chidi', name: 'Chidi Nwosu', email: 'chidi@example.com', phone: '+234 803 456 7891', city: 'Port Harcourt',
    profession: 'Carpenter & Joiner', category: 'Carpentry',
    bio: 'Custom furniture design and woodworking for homes and offices. 9 years building bespoke pieces across the South-South.',
    hourlyRate: 6500, verified: true, available: false, avgRating: 4.7, totalReviews: 62,
  },
  {
    key: 'amaka', name: 'Amaka Okonkwo', email: 'amaka@example.com', phone: '+234 803 456 7800', city: 'Lagos, Yaba',
    profession: 'Painter & Decorator', category: 'Painting',
    bio: 'Interior and exterior painting specialist. Colour consultation, textured finishes, and Venetian plaster applications.',
    hourlyRate: 5000, verified: true, available: true, avgRating: 4.9, totalReviews: 201,
  },
  {
    key: 'yusuf', name: 'Yusuf Garba', email: 'yusuf@example.com', phone: '+234 806 456 7810', city: 'Kano, Sabon Gari',
    profession: 'Auto Mechanic', category: 'Auto Repair',
    bio: 'Toyota & Nissan certified mechanic. Engine diagnostics, gearbox overhaul, AC servicing, and tyre replacements.',
    hourlyRate: 5500, verified: true, available: true, avgRating: 4.6, totalReviews: 47,
  },
  {
    key: 'ngozi', name: 'Ngozi Adeyemi', email: 'ngozi@example.com', phone: '+234 805 456 7820', city: 'Lagos, Lekki',
    profession: 'Interior Designer', category: 'Carpentry',
    bio: 'Award-winning interior designer with projects across West Africa. Space planning, furniture sourcing, and full project management.',
    hourlyRate: 15000, verified: true, available: true, avgRating: 5.0, totalReviews: 58,
  },
  {
    key: 'musa', name: 'Musa Bello', email: 'musa@example.com', phone: '+234 807 456 7830', city: 'Abuja, Gwarinpa',
    profession: 'Deep Cleaning Specialist', category: 'Home Cleaning',
    bio: 'Trained in eco-friendly deep cleaning for homes and offices. Move-in/move-out cleans, carpet steaming, and sanitisation.',
    hourlyRate: 4000, verified: true, available: true, avgRating: 4.8, totalReviews: 73,
  },
  {
    key: 'adaeze', name: 'Adaeze Uche', email: 'adaeze@example.com', phone: '+234 808 456 7840', city: 'Enugu, GRA',
    profession: 'Fashion Designer & Tailor', category: 'Tailoring',
    bio: 'Bespoke outfits, aso-ebi styling, and alterations for men and women. 10 years crafting wedding and corporate wear.',
    hourlyRate: 6000, verified: true, available: true, avgRating: 4.9, totalReviews: 112,
  },
  {
    key: 'tunde', name: 'Tunde Bakare', email: 'tunde@example.com', phone: '+234 809 456 7850', city: 'Ibadan, Bodija',
    profession: 'Tiler & Flooring Expert', category: 'Tiling & Flooring',
    bio: 'Precision tiling for kitchens, bathrooms, and outdoor spaces. Marble, granite, porcelain, and patterned tile installation.',
    hourlyRate: 5500, verified: true, available: true, avgRating: 4.7, totalReviews: 39,
  },
  {
    key: 'halima', name: 'Halima Sani', email: 'halima@example.com', phone: '+234 810 456 7860', city: 'Kano, Nasarawa',
    profession: 'Solar & Inverter Installer', category: 'Electrical',
    bio: 'Certified solar PV and inverter technician. System sizing, installation, and maintenance for homes and small businesses.',
    hourlyRate: 9000, verified: true, available: true, avgRating: 4.9, totalReviews: 67,
  },
]

async function upsertArtisan(a: ArtisanSeed) {
  const user = await prisma.user.upsert({
    where: { email: a.email },
    update: { avatar: AVATARS[a.key], name: a.name, city: a.city, isDemo: SEED_DEMO },
    create: {
      name: a.name, email: a.email, phone: a.phone, city: a.city,
      password: await bcrypt.hash('password123', 12), role: 'ARTISAN', avatar: AVATARS[a.key], isDemo: SEED_DEMO,
    },
  })
  return prisma.artisanProfile.upsert({
    where: { userId: user.id },
    update: { isDemo: SEED_DEMO },
    create: {
      userId: user.id, profession: a.profession, category: a.category, bio: a.bio, hourlyRate: a.hourlyRate,
      verified: a.verified, available: a.available, avgRating: a.avgRating, totalReviews: a.totalReviews,
      approvalStatus: 'APPROVED', verificationStatus: 'VERIFIED', isDemo: SEED_DEMO,
    },
  })
}

type HelpArticleSeed = { slug: string; category: string; title: string; content: string; order: number }

const HELP_ARTICLES: HelpArticleSeed[] = [
  { slug: 'how-to-book-an-artisan', category: 'Getting started', title: 'How do I book an artisan?', order: 1, content: 'Search or browse for an artisan, open their profile, choose a date and time, and describe the job. Use "Send Instant Request" to ask them to get in touch for free, or "Proceed to Book & Pay" to see a price estimate and pay securely through Paystack.' },
  { slug: 'do-i-need-an-account', category: 'Getting started', title: 'Do I need an account to book?', order: 2, content: 'Yes. Registering lets you send booking requests, pay, save artisans, and rebook later. Your phone number and job address are saved so booking again is one tap.' },
  { slug: 'instant-request-vs-book-and-pay', category: 'Getting started', title: 'What is the difference between "Send Instant Request" and "Proceed to Book & Pay"?', order: 3, content: 'An instant request is free. It notifies the artisan with your contact details so they can reach you directly. "Proceed to Book & Pay" shows a price estimate and takes you through checkout; your booking is confirmed once payment succeeds.' },
  { slug: 'how-do-i-find-an-artisan', category: 'Getting started', title: 'How do I find the right artisan?', order: 4, content: 'Use the search page to filter by profession, city, price range, minimum rating, and distance from you. Verified artisans carry a badge, and every profile shows reviews, completed-job history, and skill badges. You can message an artisan on WhatsApp before you book.' },
  { slug: 'how-do-payments-work', category: 'Booking & payments', title: 'How do payments work?', order: 1, content: 'Checkout is handled by Paystack. You can pay with card, bank transfer, or USSD. Your booking is confirmed once the payment succeeds, and both you and the artisan get a notification.' },
  { slug: 'why-is-there-a-platform-fee', category: 'Booking & payments', title: 'Why is there a platform fee?', order: 2, content: 'The price estimate shows the artisan rate plus a small platform fee. The fee keeps NaijaHandy running: matching, verification, and support. You always see the full estimate before you pay.' },
  { slug: 'can-i-cancel-a-booking', category: 'Booking & payments', title: 'Can I cancel a booking?', order: 3, content: 'Yes. Open your booking from the Bookings page and cancel it. If you already paid, contact us from the Help Centre and we will help you sort out a refund.' },
  { slug: 'is-an-instant-request-charged', category: 'Booking & payments', title: 'Will I be charged for an instant request?', order: 4, content: 'No. Instant requests are free. You only pay when you complete checkout for a booking.' },
  { slug: 'how-are-refunds-handled', category: 'Booking & payments', title: 'How are refunds handled?', order: 5, content: 'If a paid booking is cancelled or the job is not done as agreed, raise the issue with the artisan first, then open a dispute from the booking within 14 days of the job date. NaijaHandy reviews the evidence and, where the guarantee applies, arranges a refund or a rework.' },
  { slug: 'how-does-book-again-work', category: 'Booking & payments', title: 'How do I book the same artisan again?', order: 6, content: 'Completed bookings on your Bookings page have a "Book Again" button. It opens the artisan profile with the previous time and job description prefilled, so rehiring a trusted artisan takes one tap.' },
  { slug: 'how-do-i-know-an-artisan-is-verified', category: 'Trust & safety', title: 'How do I know an artisan is verified?', order: 1, content: 'Artisans who pass ID verification carry a verified badge on their profile. You can also read reviews and check each profile completed-job history before booking.' },
  { slug: 'are-reviews-moderated', category: 'Trust & safety', title: 'Are reviews moderated?', order: 2, content: 'Yes. Reviews are checked and hidden if they break our guidelines, so what you see reflects real completed work. Reviews only come from completed bookings and carry a "Verified buyer" tag.' },
  { slug: 'what-is-id-verification', category: 'Trust & safety', title: 'What is ID verification?', order: 3, content: 'Artisans can submit an ID document from their profile. Our team reviews it, and once approved the artisan carries a verified badge. Submitted documents are never shown publicly.' },
  { slug: 'what-is-the-naijahandy-guarantee', category: 'Disputes & guarantee', title: 'What is the NaijaHandy Guarantee?', order: 1, content: 'Paid bookings are protected by the NaijaHandy Guarantee: if the job is not done right, we work to make it right with a refund or a rework. Claims must be raised within 14 days of the job date. Read the full policy on the Service Guarantee page.' },
  { slug: 'what-if-something-goes-wrong', category: 'Disputes & guarantee', title: 'What if something goes wrong with a job?', order: 2, content: 'From your booking you can raise a dispute and our team will review it. Paid bookings are covered by the NaijaHandy Guarantee, and claims raised within 14 days of the job date are eligible for a refund or rework.' },
  { slug: 'how-do-i-raise-a-dispute', category: 'Disputes & guarantee', title: 'How do I raise a dispute?', order: 3, content: 'Open the booking from your Bookings page and choose "Raise a dispute", then explain the problem. Keep messages and photos as evidence. Claims must be raised within 14 days of the job date for the guarantee to apply.' },
  { slug: 'how-do-i-receive-booking-requests', category: 'For artisans', title: 'How do I receive booking requests?', order: 1, content: 'New requests appear in your artisan dashboard where you can accept or decline them. You will also be notified by email and in-app. Urgent requests appear at the top and are marked with an Urgent badge.' },
  { slug: 'how-do-i-get-the-verified-badge', category: 'For artisans', title: 'How do I get the verified badge?', order: 2, content: 'Submit an ID document from your artisan profile. Our team reviews it, and once approved you will carry the verified badge on your profile.' },
  { slug: 'how-do-artisans-get-paid', category: 'For artisans', title: 'How do artisans get paid?', order: 3, content: 'Customers pay securely through Paystack when they check out. When a booking is paid you get a PAYMENT_RECEIVED notification, and completing the job moves it into your completed history, which builds trust and attracts more bookings.' },
  { slug: 'what-is-an-urgent-request', category: 'For artisans', title: 'What is an urgent request?', order: 4, content: 'Urgent requests are same-day jobs customers flagged as time-sensitive. They are sorted to the top of your job requests and marked with an Urgent badge so you can spot them quickly. Accepting them is just like any other request.' },
]

async function main() {
  ensureDatabaseMigrated()

  const password = await bcrypt.hash('password123', 12)

  // ── Admin ──
  await prisma.user.upsert({
    where: { email: 'admin@naijahandy.com' },
    update: { name: 'NaijaHandy Admin', phone: '+234 800 000 0000', city: 'Lagos' },
    create: { name: 'NaijaHandy Admin', email: 'admin@naijahandy.com', phone: '+234 800 000 0000', city: 'Lagos', password, role: 'ADMIN' },
  })

  // ── Customers (demo) ──
  const customer1 = await prisma.user.upsert({
    where: { email: 'chisom@example.com' },
    update: { name: 'Chisom Eze', phone: '+234 803 456 7890', city: 'Lagos', isDemo: SEED_DEMO },
    create: { name: 'Chisom Eze', email: 'chisom@example.com', phone: '+234 803 456 7890', city: 'Lagos', password, role: 'CUSTOMER', isDemo: SEED_DEMO },
  })
  await prisma.user.upsert({
    where: { email: 'bayo@example.com' },
    update: { name: 'Bayo Adeleke', phone: '+234 802 345 6789', city: 'Abuja', isDemo: SEED_DEMO },
    create: { name: 'Bayo Adeleke', email: 'bayo@example.com', phone: '+234 802 345 6789', city: 'Abuja', password, role: 'CUSTOMER', isDemo: SEED_DEMO },
  })

  // ── Artisans (10) ──
  const profiles: Record<string, { id: string }> = {}
  for (const a of ARTISANS) {
    profiles[a.key] = await upsertArtisan(a)
  }
  const emeka = profiles.emeka
  const fatima = profiles.fatima
  const chidi = profiles.chidi

  // ── Services ──
  const services = [
    { artisanId: emeka.id, name: 'Pipe Installation', rate: 8500 },
    { artisanId: emeka.id, name: 'Emergency Leak Repair', rate: 12000 },
    { artisanId: emeka.id, name: 'Bathroom Fitting', rate: 45000 },
    { artisanId: emeka.id, name: 'Drain Cleaning', rate: 6000 },
  ]
  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { artisanId: s.artisanId, name: s.name } })
    if (!exists) await prisma.service.create({ data: s })
  }

  // ── Bookings ──
  await prisma.booking.deleteMany({ where: { customerId: customer1.id } })
  await prisma.booking.createMany({ data: [
    { customerId: customer1.id, artisanId: emeka.id, date: new Date('2026-07-30'), time: '9:00 AM', description: 'Fix leaking kitchen sink pipe', amount: 17000, status: 'CONFIRMED', paymentStatus: 'PAID', paymentReference: 'seed-emeka-001', paidAt: new Date('2026-07-29') },
    { customerId: customer1.id, artisanId: fatima.id, date: new Date('2026-08-02'), time: '2:00 PM', description: 'Install new electrical outlets in living room', amount: 15000, status: 'PENDING', paymentStatus: 'UNPAID' },
    { customerId: customer1.id, artisanId: chidi.id, date: new Date('2026-07-19'), time: '10:00 AM', description: 'Build custom bookshelf', amount: 26000, status: 'COMPLETED', paymentStatus: 'PAID', paymentReference: 'seed-chidi-001', paidAt: new Date('2026-07-18') },
  ] })

  // ── Payments (backing records for the PAID bookings) ──
  const paidBookings = await prisma.booking.findMany({
    where: { customerId: customer1.id, paymentStatus: 'PAID' },
    select: { id: true, amount: true },
  })
  for (const b of paidBookings) {
    const existing = await prisma.payment.findUnique({ where: { bookingId: b.id } })
    if (!existing) {
      await prisma.payment.create({
        data: { bookingId: b.id, reference: `seed-pay-${b.id.slice(-6)}`, amount: b.amount, status: 'SUCCESS', provider: 'PAYSTACK', paidAt: new Date() },
      })
    }
  }

  // ── Help Centre articles (source of truth for /help + AI assistant corpus) ──
  for (const [i, a] of HELP_ARTICLES.entries()) {
    await prisma.helpArticle.upsert({
      where: { slug: a.slug },
      update: { category: a.category, title: a.title, content: a.content, order: a.order },
      create: { slug: a.slug, category: a.category, title: a.title, content: a.content, order: a.order },
    })
  }

  console.log('Database seeded successfully!')
  console.log('  Admin:     admin@naijahandy.com')
  console.log('  Customers: chisom@example.com / bayo@example.com')
  console.log(`  Artisans:  ${ARTISANS.map((a) => a.email).join(' / ')}`)
  console.log(`  Password:  password123 (for all)`)
  console.log(`  Demo flags: ${SEED_DEMO ? 'enabled (isDemo=true on seeded artisans + customers)' : 'disabled (SEED_DEMO=0, production-safe)'}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
