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
  segun: 'https://images.pexels.com/photos/35533370/pexels-photo-35533370.jpeg?auto=compress&cs=tinysrgb&w=800',
  ibrahim: 'https://images.pexels.com/photos/33242998/pexels-photo-33242998.jpeg?auto=compress&cs=tinysrgb&w=800',
  blessing: 'https://images.pexels.com/photos/38250933/pexels-photo-38250933.jpeg?auto=compress&cs=tinysrgb&w=800',
  bukola: 'https://images.pexels.com/photos/38180101/pexels-photo-38180101.jpeg?auto=compress&cs=tinysrgb&w=800',
  chukwuma: 'https://images.pexels.com/photos/36029380/pexels-photo-36029380.jpeg?auto=compress&cs=tinysrgb&w=800',
}

const CUSTOMER_AVATARS: Record<string, string> = {
  chisom: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&auto=format',
  bayo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format',
  nneka: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&auto=format',
  ada: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&auto=format',
  kelechi: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&auto=format',
  zainab: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&auto=format',
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
}

const ARTISANS: ArtisanSeed[] = [
  {
    key: 'emeka', name: 'Emeka Okafor', email: 'emeka@example.com', phone: '+234 801 234 5678', city: 'Lagos, VI',
    profession: 'Master Plumber', category: 'Plumbing',
    bio: 'Over 12 years of experience fixing residential and commercial plumbing across Lagos. Specialise in pipe installations and emergency repairs.',
    hourlyRate: 8500, verified: true, available: true,
  },
  {
    key: 'fatima', name: 'Fatima Aliyu', email: 'fatima@example.com', phone: '+234 802 345 6780', city: 'Abuja, Wuse',
    profession: 'Electrician', category: 'Electrical',
    bio: 'Certified electrical engineer with COREN accreditation. Residential wiring, industrial installations, and solar panel setups.',
    hourlyRate: 7500, verified: true, available: true,
  },
  {
    key: 'chidi', name: 'Chidi Nwosu', email: 'chidi@example.com', phone: '+234 803 456 7891', city: 'Port Harcourt',
    profession: 'Carpenter & Joiner', category: 'Carpentry',
    bio: 'Custom furniture design and woodworking for homes and offices. 9 years building bespoke pieces across the South-South.',
    hourlyRate: 6500, verified: true, available: false,
  },
  {
    key: 'amaka', name: 'Amaka Okonkwo', email: 'amaka@example.com', phone: '+234 803 456 7800', city: 'Lagos, Yaba',
    profession: 'Painter & Decorator', category: 'Painting',
    bio: 'Interior and exterior painting specialist. Colour consultation, textured finishes, and Venetian plaster applications.',
    hourlyRate: 5000, verified: true, available: true,
  },
  {
    key: 'yusuf', name: 'Yusuf Garba', email: 'yusuf@example.com', phone: '+234 806 456 7810', city: 'Kano, Sabon Gari',
    profession: 'Auto Mechanic', category: 'Auto Repair',
    bio: 'Toyota & Nissan certified mechanic. Engine diagnostics, gearbox overhaul, AC servicing, and tyre replacements.',
    hourlyRate: 5500, verified: true, available: true,
  },
  {
    key: 'ngozi', name: 'Ngozi Adeyemi', email: 'ngozi@example.com', phone: '+234 805 456 7820', city: 'Lagos, Lekki',
    profession: 'Interior Designer', category: 'Carpentry',
    bio: 'Award-winning interior designer with projects across West Africa. Space planning, furniture sourcing, and full project management.',
    hourlyRate: 15000, verified: true, available: true,
  },
  {
    key: 'musa', name: 'Musa Bello', email: 'musa@example.com', phone: '+234 807 456 7830', city: 'Abuja, Gwarinpa',
    profession: 'Deep Cleaning Specialist', category: 'Home Cleaning',
    bio: 'Trained in eco-friendly deep cleaning for homes and offices. Move-in/move-out cleans, carpet steaming, and sanitisation.',
    hourlyRate: 4000, verified: true, available: true,
  },
  {
    key: 'adaeze', name: 'Adaeze Uche', email: 'adaeze@example.com', phone: '+234 808 456 7840', city: 'Enugu, GRA',
    profession: 'Fashion Designer & Tailor', category: 'Tailoring',
    bio: 'Bespoke outfits, aso-ebi styling, and alterations for men and women. 10 years crafting wedding and corporate wear.',
    hourlyRate: 6000, verified: true, available: true,
  },
  {
    key: 'tunde', name: 'Tunde Bakare', email: 'tunde@example.com', phone: '+234 809 456 7850', city: 'Ibadan, Bodija',
    profession: 'Tiler & Flooring Expert', category: 'Tiling & Flooring',
    bio: 'Precision tiling for kitchens, bathrooms, and outdoor spaces. Marble, granite, porcelain, and patterned tile installation.',
    hourlyRate: 5500, verified: true, available: true,
  },
  {
    key: 'halima', name: 'Halima Sani', email: 'halima@example.com', phone: '+234 810 456 7860', city: 'Kano, Nasarawa',
    profession: 'Solar & Inverter Installer', category: 'Electrical',
    bio: 'Certified solar PV and inverter technician. System sizing, installation, and maintenance for homes and small businesses.',
    hourlyRate: 9000, verified: true, available: true,
  },
  {
    key: 'segun', name: 'Segun Adebayo', email: 'segun@example.com', phone: '+234 811 456 7870', city: 'Lagos, Ikeja',
    profession: 'AC & Refrigeration Technician', category: 'Air Conditioning',
    bio: 'Nigerian Air Conditioning & Refrigeration (NACR) certified. Installation, servicing, and repairs of split, window, and central AC units.',
    hourlyRate: 7000, verified: true, available: true,
  },
  {
    key: 'ibrahim', name: 'Ibrahim Jatau', email: 'ibrahim@example.com', phone: '+234 812 456 7880', city: 'Kano, Kofar Naisa',
    profession: 'Welder & Metal Fabricator', category: 'Welding & Metalwork',
    bio: 'Custom metal fabrication, security gates, burglary-proof windows, and structural repairs. 14 years of arc and MIG welding.',
    hourlyRate: 5000, verified: true, available: true,
  },
  {
    key: 'blessing', name: 'Blessing Eze', email: 'blessing@example.com', phone: '+234 813 456 7890', city: 'Enugu, Independence Layout',
    profession: 'Phone & Laptop Repair Specialist', category: 'Electronics Repair',
    bio: 'Screen replacements, battery swaps, water-damage recovery, and component-level repairs for phones and laptops. Same-day service in most cases.',
    hourlyRate: 4000, verified: true, available: true,
  },
  {
    key: 'bukola', name: 'Bukola Salami', email: 'bukola@example.com', phone: '+234 814 456 7900', city: 'Abuja, Wuse II',
    profession: 'Residential Cleaner', category: 'Home Cleaning',
    bio: 'Reliable residential and office cleaning. Eco-friendly products, deep cleans, and regular scheduled visits across Abuja.',
    hourlyRate: 4500, verified: true, available: true,
  },
  {
    key: 'chukwuma', name: 'Chukwuma Obi', email: 'chukwuma@example.com', phone: '+234 815 456 7910', city: 'Benin City',
    profession: 'Mason & Brickwork Expert', category: 'Tiling & Flooring',
    bio: 'Blockwork, boundary fences, foundations, and brick repairs. Over 16 years delivering durable masonry across Edo and Delta states.',
    hourlyRate: 5500, verified: true, available: true,
  },
]

type ReviewSeed = {
  customerKey: string
  rating: number
  comment: string
  job: string
  amount: number
  monthsAgo: number
}

// Every review is backed by a real COMPLETED booking, so displayed ratings and
// completed-job counts are honest demo data — never cosmetic numbers.
const REVIEWS: Record<string, ReviewSeed[]> = {
  emeka: [
    { customerKey: 'chisom', rating: 5, comment: 'Emeka fixed our burst pipe in under an hour. Professional and tidy — I will definitely hire him again.', job: 'Emergency burst pipe repair', amount: 12000, monthsAgo: 2 },
    { customerKey: 'bayo', rating: 5, comment: 'Replaced the full bathroom fittings. Great attention to detail and very reasonable pricing.', job: 'Full bathroom fitting', amount: 45000, monthsAgo: 5 },
    { customerKey: 'nneka', rating: 4, comment: 'Solid work on our kitchen drain. Took slightly longer than promised but the result was good.', job: 'Kitchen drain unclogging', amount: 6000, monthsAgo: 8 },
    { customerKey: 'ada', rating: 5, comment: 'Installed a new kitchen sink and pipes. Very clean job and he cleaned up after himself.', job: 'Kitchen sink installation', amount: 17000, monthsAgo: 1 },
    { customerKey: 'kelechi', rating: 5, comment: 'Very punctual and honest about pricing. Would recommend to anyone in Lagos.', job: 'Water heater installation', amount: 21000, monthsAgo: 3 },
  ],
  fatima: [
    { customerKey: 'bayo', rating: 5, comment: 'Rewired our living room and installed new sockets. Fatima is meticulous and very safety-conscious.', job: 'Living room rewiring', amount: 35000, monthsAgo: 4 },
    { customerKey: 'chisom', rating: 4, comment: 'Installed outlets in the bedroom. Good work, communication could be a bit faster.', job: 'Bedroom outlet installation', amount: 12000, monthsAgo: 1 },
    { customerKey: 'zainab', rating: 5, comment: 'Set up our solar inverter backup and it is working perfectly. Very knowledgeable.', job: 'Solar inverter installation', amount: 90000, monthsAgo: 6 },
    { customerKey: 'ada', rating: 4, comment: 'Fixed a persistent power fluctuation issue. Professional service.', job: 'Electrical fault tracing', amount: 15000, monthsAgo: 9 },
  ],
  chidi: [
    { customerKey: 'kelechi', rating: 5, comment: 'Built a custom bookshelf exactly as I described. Beautiful joinery work.', job: 'Build custom bookshelf', amount: 26000, monthsAgo: 3 },
  ],
  amaka: [
    { customerKey: 'chisom', rating: 5, comment: 'Painted our 3-bedroom apartment. Beautiful finishes and she left everything spotless.', job: '3-bedroom apartment painting', amount: 60000, monthsAgo: 2 },
    { customerKey: 'ada', rating: 5, comment: 'The accent wall she did for our living room is stunning. A true artist.', job: 'Living room accent wall', amount: 15000, monthsAgo: 1 },
    { customerKey: 'nneka', rating: 4, comment: 'Good quality painting, though a bit pricey. Happy with the result.', job: 'Bedroom repaint', amount: 20000, monthsAgo: 6 },
    { customerKey: 'zainab', rating: 5, comment: 'Venetian plaster finish on our hallway — everyone compliments it.', job: 'Venetian plaster hallway', amount: 45000, monthsAgo: 4 },
  ],
  yusuf: [
    { customerKey: 'kelechi', rating: 4, comment: 'Brake pad replacement done well. Honest pricing.', job: 'Brake pad replacement', amount: 11000, monthsAgo: 2 },
    { customerKey: 'chisom', rating: 5, comment: 'Fixed a strange engine noise that two other mechanics could not diagnose.', job: 'Engine diagnostic', amount: 8000, monthsAgo: 5 },
    { customerKey: 'bayo', rating: 4, comment: 'AC servicing made the car cool again. Good job.', job: 'AC gas refill and service', amount: 12000, monthsAgo: 8 },
  ],
  ngozi: [
    { customerKey: 'chisom', rating: 5, comment: 'Ngozi transformed our living room into something from a magazine. Worth every naira.', job: 'Full living room redesign', amount: 250000, monthsAgo: 3 },
    { customerKey: 'ada', rating: 5, comment: 'Managed our office interior project from start to finish. Incredible attention to detail.', job: 'Office interior project', amount: 350000, monthsAgo: 1 },
    { customerKey: 'nneka', rating: 5, comment: 'Furniture sourcing and space planning — she nailed our aesthetic perfectly.', job: 'Furniture sourcing', amount: 120000, monthsAgo: 7 },
    { customerKey: 'nneka', rating: 4, comment: 'Solid dining table, delivered a few days late but the quality is excellent.', job: 'Custom dining table', amount: 85000, monthsAgo: 7 },
    { customerKey: 'chisom', rating: 5, comment: 'Made bespoke wardrobes for our bedroom. Fantastic craftsmanship.', job: 'Bespoke wardrobe set', amount: 120000, monthsAgo: 1 },
  ],
  musa: [
    { customerKey: 'nneka', rating: 5, comment: 'Move-out clean was thorough. Our landlord returned the full deposit!', job: 'Move-out deep clean', amount: 25000, monthsAgo: 2 },
    { customerKey: 'bayo', rating: 5, comment: 'Carpet steaming removed stains we thought were permanent.', job: 'Carpet steaming', amount: 18000, monthsAgo: 4 },
    { customerKey: 'zainab', rating: 4, comment: 'Office sanitisation done well and on schedule.', job: 'Office sanitisation', amount: 30000, monthsAgo: 6 },
  ],
  adaeze: [
    { customerKey: 'ada', rating: 5, comment: 'My aso-ebi outfits were stunning. Fits were perfect and delivery was on time.', job: 'Aso-ebi outfit set', amount: 55000, monthsAgo: 2 },
    { customerKey: 'chisom', rating: 4, comment: 'Alterations done quickly and neatly.', job: 'Wedding dress alterations', amount: 12000, monthsAgo: 5 },
    { customerKey: 'zainab', rating: 5, comment: 'Bespoke corporate wear for the whole team. Excellent tailoring.', job: 'Corporate wear set', amount: 90000, monthsAgo: 1 },
  ],
  tunde: [
    { customerKey: 'chisom', rating: 5, comment: 'Tiled our kitchen and bathrooms. Perfect lines, no waste. Highly recommend.', job: 'Kitchen and bathroom tiling', amount: 95000, monthsAgo: 3 },
    { customerKey: 'bayo', rating: 4, comment: 'Good tiling work on the balcony. Started a day late but finished strong.', job: 'Balcony tiling', amount: 35000, monthsAgo: 6 },
    { customerKey: 'kelechi', rating: 5, comment: 'Marble flooring in our lobby — stunning workmanship.', job: 'Marble lobby flooring', amount: 180000, monthsAgo: 1 },
  ],
  halima: [
    { customerKey: 'zainab', rating: 5, comment: 'Installed a 3.5kVA inverter system. Halima explained everything clearly and it works flawlessly.', job: '3.5kVA inverter installation', amount: 320000, monthsAgo: 2 },
    { customerKey: 'bayo', rating: 5, comment: 'Solar panels on our roof, professionally installed and neatly wired.', job: 'Roof solar installation', amount: 450000, monthsAgo: 5 },
    { customerKey: 'chisom', rating: 4, comment: 'System maintenance service. Honest and reliable.', job: 'Inverter maintenance', amount: 15000, monthsAgo: 8 },
  ],
  segun: [
    { customerKey: 'bayo', rating: 5, comment: 'Serviced both our AC units. Cool and quiet now.', job: 'Dual AC servicing', amount: 30000, monthsAgo: 2 },
    { customerKey: 'chisom', rating: 5, comment: 'Repaired a faulty compressor quickly and at a fair price.', job: 'Compressor replacement', amount: 45000, monthsAgo: 4 },
    { customerKey: 'kelechi', rating: 4, comment: 'Good installation, tidy pipework.', job: 'AC installation', amount: 40000, monthsAgo: 1 },
  ],
  ibrahim: [
    { customerKey: 'kelechi', rating: 5, comment: 'Fabricated our security gate and burglar-proof windows. Sturdy and neat welds.', job: 'Security gate fabrication', amount: 150000, monthsAgo: 3 },
    { customerKey: 'chisom', rating: 4, comment: 'Repaired a broken fence section. Solid work.', job: 'Fence repair', amount: 18000, monthsAgo: 6 },
    { customerKey: 'nneka', rating: 5, comment: 'Custom metal bed frame — exactly what I wanted.', job: 'Custom metal bed frame', amount: 65000, monthsAgo: 1 },
    { customerKey: 'bayo', rating: 4, comment: 'Repaired our office chairs and desks. Quick turnaround.', job: 'Office furniture repair', amount: 15000, monthsAgo: 5 },
  ],
  blessing: [
    { customerKey: 'ada', rating: 5, comment: 'Fixed my phone screen the same day. Amazing service.', job: 'Phone screen replacement', amount: 38000, monthsAgo: 2 },
    { customerKey: 'zainab', rating: 4, comment: 'Laptop battery replacement worked well. Slightly pricey.', job: 'Laptop battery replacement', amount: 25000, monthsAgo: 4 },
    { customerKey: 'kelechi', rating: 5, comment: 'Recovered all my photos after a water spill. Lifesaver!', job: 'Water damage recovery', amount: 30000, monthsAgo: 1 },
  ],
  bukola: [
    { customerKey: 'nneka', rating: 5, comment: 'Weekly cleaning service — my home has never been this fresh.', job: 'Weekly home cleaning', amount: 9000, monthsAgo: 2 },
    { customerKey: 'chisom', rating: 4, comment: 'Deep clean for a post-party mess. Very thorough.', job: 'Post-party deep clean', amount: 20000, monthsAgo: 5 },
    { customerKey: 'bayo', rating: 5, comment: 'Professional, reliable and friendly. Booking again.', job: 'Apartment spring clean', amount: 15000, monthsAgo: 1 },
  ],
  chukwuma: [
    { customerKey: 'bayo', rating: 5, comment: 'Built our boundary fence. Excellent bricks and straight lines.', job: 'Boundary fence build', amount: 180000, monthsAgo: 4 },
    { customerKey: 'chisom', rating: 4, comment: 'Fixed a cracked wall and repointed the bricks. Good job.', job: 'Wall crack repair', amount: 22000, monthsAgo: 2 },
    { customerKey: 'kelechi', rating: 5, comment: 'Constructed our foundation. Trustworthy and skilled.', job: 'Foundation construction', amount: 800000, monthsAgo: 8 },
  ],
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

const SERVICES: Record<string, { name: string; rate: number }[]> = {
  emeka: [
    { name: 'Pipe Installation', rate: 8500 },
    { name: 'Emergency Leak Repair', rate: 12000 },
    { name: 'Bathroom Fitting', rate: 45000 },
    { name: 'Drain Cleaning', rate: 6000 },
  ],
  fatima: [
    { name: 'House Rewiring', rate: 35000 },
    { name: 'Socket Installation', rate: 12000 },
    { name: 'Solar Inverter Setup', rate: 90000 },
  ],
  amaka: [
    { name: 'Full Apartment Painting', rate: 60000 },
    { name: 'Accent Wall', rate: 15000 },
  ],
  musa: [
    { name: 'Move-out Deep Clean', rate: 25000 },
    { name: 'Carpet Steaming', rate: 18000 },
  ],
  segun: [
    { name: 'AC Servicing', rate: 15000 },
    { name: 'AC Installation', rate: 40000 },
  ],
  ibrahim: [
    { name: 'Gate Fabrication', rate: 150000 },
    { name: 'General Welding', rate: 20000 },
  ],
  blessing: [
    { name: 'Screen Replacement', rate: 38000 },
    { name: 'Battery Replacement', rate: 25000 },
  ],
  chukwuma: [
    { name: 'Boundary Fence', rate: 180000 },
    { name: 'Wall Repair', rate: 22000 },
  ],
  adaeze: [
    { name: 'Bespoke Tailoring', rate: 55000 },
    { name: 'Alterations', rate: 12000 },
  ],
  tunde: [
    { name: 'Kitchen & Bathroom Tiling', rate: 95000 },
    { name: 'Flooring Installation', rate: 80000 },
  ],
  halima: [
    { name: 'Inverter Installation', rate: 320000 },
    { name: 'Solar Installation', rate: 450000 },
  ],
}

const PORTFOLIO: Record<string, { imageUrl: string; caption: string }[]> = {
  emeka: [
    { imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop&auto=format', caption: 'Modern bathroom fittings' },
    { imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&h=450&fit=crop&auto=format', caption: 'Kitchen sink installation' },
  ],
  amaka: [
    { imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=450&fit=crop&auto=format', caption: 'Living room accent wall' },
  ],
  ngozi: [
    { imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&fit=crop&auto=format', caption: 'Living room redesign' },
  ],
}

const monthsAgo = (n: number): Date => new Date(Date.now() - n * 30.44 * 24 * 3600 * 1000)

async function upsertArtisan(a: ArtisanSeed) {
  const user = await prisma.user.upsert({
    where: { email: a.email },
    update: { avatar: AVATARS[a.key], name: a.name, city: a.city, isDemo: SEED_DEMO, emailVerified: true },
    create: {
      name: a.name, email: a.email, phone: a.phone, city: a.city,
      password: await bcrypt.hash('password123', 12), role: 'ARTISAN', avatar: AVATARS[a.key], isDemo: SEED_DEMO, emailVerified: true,
    },
  })
  return prisma.artisanProfile.upsert({
    where: { userId: user.id },
    update: { isDemo: SEED_DEMO },
    create: {
      userId: user.id, profession: a.profession, category: a.category, bio: a.bio, hourlyRate: a.hourlyRate,
      verified: a.verified, available: a.available, avgRating: 0, totalReviews: 0,
      approvalStatus: 'APPROVED', verificationStatus: 'VERIFIED', isDemo: SEED_DEMO,
    },
  })
}

async function upsertCustomer(key: string, name: string, email: string, phone: string, city: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, phone, city, avatar: CUSTOMER_AVATARS[key], isDemo: SEED_DEMO, emailVerified: true },
    create: {
      name, email, phone, city, avatar: CUSTOMER_AVATARS[key], password: await bcrypt.hash('password123', 12), role: 'CUSTOMER', isDemo: SEED_DEMO, emailVerified: true,
    },
  })
  return user
}

async function main() {
  ensureDatabaseMigrated()

  const password = await bcrypt.hash('password123', 12)

  // ── Admin ──
  await prisma.user.upsert({
    where: { email: 'admin@naijahandy.com' },
    update: { name: 'NaijaHandy Admin', phone: '+234 800 000 0000', city: 'Lagos', emailVerified: true },
    create: { name: 'NaijaHandy Admin', email: 'admin@naijahandy.com', phone: '+234 800 000 0000', city: 'Lagos', password, role: 'ADMIN', emailVerified: true },
  })

  // ── Customers (demo) ──
  const customers = await Promise.all([
    upsertCustomer('chisom', 'Chisom Eze', 'chisom@example.com', '+234 803 456 7890', 'Lagos'),
    upsertCustomer('bayo', 'Bayo Adeleke', 'bayo@example.com', '+234 802 345 6789', 'Abuja'),
    upsertCustomer('nneka', 'Nneka Obi', 'nneka@example.com', '+234 804 456 7891', 'Port Harcourt'),
    upsertCustomer('ada', 'Ada Okafor', 'ada@example.com', '+234 805 456 7892', 'Enugu'),
    upsertCustomer('kelechi', 'Kelechi Nwachukwu', 'kelechi@example.com', '+234 806 456 7893', 'Ibadan'),
    upsertCustomer('zainab', 'Zainab Abdullahi', 'zainab@example.com', '+234 807 456 7894', 'Kano'),
  ])
  const customerByKey = Object.fromEntries(customers.map((c, i) => [['chisom', 'bayo', 'nneka', 'ada', 'kelechi', 'zainab'][i], c]))

  // ── Artisans (15) ──
  const profiles: Record<string, { id: string }> = {}
  for (const a of ARTISANS) {
    profiles[a.key] = await upsertArtisan(a)
  }

  const profileIds = Object.values(profiles).map((p) => p.id)
  const customerIds = customers.map((c) => c.id)

  // Reset previous demo bookings/payments/reviews so re-running the seed is safe.
  await prisma.review.deleteMany({
    where: { booking: { OR: [{ customerId: { in: customerIds } }, { artisanId: { in: profileIds } }] } },
  })
  await prisma.dispute.deleteMany({
    where: { booking: { OR: [{ customerId: { in: customerIds } }, { artisanId: { in: profileIds } }] } },
  })
  await prisma.payment.deleteMany({
    where: { booking: { OR: [{ customerId: { in: customerIds } }, { artisanId: { in: profileIds } }] } },
  })
  await prisma.booking.deleteMany({
    where: { OR: [{ customerId: { in: customerIds } }, { artisanId: { in: profileIds } }] },
  })

  // ── Services & portfolio ──
  for (const [key, list] of Object.entries(SERVICES)) {
    for (const s of list) {
      const exists = await prisma.service.findFirst({ where: { artisanId: profiles[key].id, name: s.name } })
      if (!exists) await prisma.service.create({ data: { artisanId: profiles[key].id, ...s } })
    }
  }
  for (const [key, items] of Object.entries(PORTFOLIO)) {
    for (const item of items) {
      const exists = await prisma.portfolioItem.findFirst({ where: { artisanId: profiles[key].id, imageUrl: item.imageUrl } })
      if (!exists) await prisma.portfolioItem.create({ data: { artisanId: profiles[key].id, ...item } })
    }
  }

  // ── Completed bookings + reviews (honest ratings & completed-job counts) ──
  let refCounter = 0
  for (const [key, reviews] of Object.entries(REVIEWS)) {
    for (const r of reviews) {
      const booking = await prisma.booking.create({
        data: {
          customerId: customerByKey[r.customerKey].id,
          artisanId: profiles[key].id,
          date: monthsAgo(r.monthsAgo),
          time: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'][refCounter % 5],
          description: r.job,
          amount: r.amount,
          address: null,
          customerPhone: customerByKey[r.customerKey].phone,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentReference: `seed-${key}-${refCounter}`,
          paidAt: monthsAgo(r.monthsAgo + 0.01),
        },
      })
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          reference: `seed-pay-${booking.id.slice(-6)}`,
          amount: r.amount,
          status: 'SUCCESS',
          provider: 'PAYSTACK',
          paidAt: monthsAgo(r.monthsAgo + 0.01),
        },
      })
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          customerId: customerByKey[r.customerKey].id,
          artisanId: profiles[key].id,
          rating: r.rating,
          comment: r.comment,
          status: 'APPROVED',
        },
      })
      refCounter++
    }
  }

  // Recompute honest average rating / review count per artisan from the seeded rows.
  const reviewStats = await prisma.review.groupBy({
    by: ['artisanId'],
    where: { artisanId: { in: profileIds } },
    _avg: { rating: true },
    _count: { rating: true },
  })
  for (const stat of reviewStats) {
    await prisma.artisanProfile.update({
      where: { id: stat.artisanId },
      data: {
        avgRating: stat._avg.rating ? Math.round(stat._avg.rating * 10) / 10 : 0,
        totalReviews: stat._count.rating,
      },
    })
  }

  // ── Active demo bookings for Chisom & Bayo ──
  const chisom = customerByKey.chisom
  const bayo = customerByKey.bayo
  await prisma.booking.createMany({ data: [
    { customerId: chisom.id, artisanId: profiles.emeka.id, date: monthsAgo(-0.5), time: '9:00 AM', description: 'Fix leaking kitchen sink pipe', amount: 17000, status: 'CONFIRMED', paymentStatus: 'PAID', paymentReference: 'seed-emeka-active', paidAt: new Date() },
    { customerId: chisom.id, artisanId: profiles.fatima.id, date: monthsAgo(-0.2), time: '2:00 PM', description: 'Install new electrical outlets in living room', amount: 15000, status: 'PENDING', paymentStatus: 'UNPAID' },
    { customerId: bayo.id, artisanId: profiles.segun.id, date: new Date(Date.now() + 3600_000), time: '4:00 PM', description: 'AC not cooling — need same-day servicing', amount: 15000, status: 'PENDING', paymentStatus: 'UNPAID', isUrgent: true },
    { customerId: bayo.id, artisanId: profiles.tunde.id, date: monthsAgo(1), time: '10:00 AM', description: 'Tile replacement in guest bathroom', amount: 35000, status: 'REJECTED', paymentStatus: 'UNPAID' },
  ] })

  const paidActive = await prisma.booking.findMany({
    where: { customerId: chisom.id, paymentStatus: 'PAID' },
    select: { id: true, amount: true },
  })
  for (const b of paidActive) {
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
  console.log('  Customers: chisom@example.com / bayo@example.com / nneka@example.com / ada@example.com / kelechi@example.com / zainab@example.com')
  console.log(`  Artisans:  ${ARTISANS.map((a) => a.email).join(' / ')}`)
  console.log(`  Reviews:   ${refCounter} reviews across ${ARTISANS.length} artisans (each backed by a completed booking)`)
  console.log('  Password:  password123 (for all)')
  console.log(`  Demo flags: ${SEED_DEMO ? 'enabled (isDemo=true on seeded artisans + customers)' : 'disabled (SEED_DEMO=0, production-safe)'}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
