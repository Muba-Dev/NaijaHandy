import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const AVATARS: Record<string, string> = {
  emeka: 'https://randomuser.me/api/portraits/men/32.jpg',
  fatima: 'https://randomuser.me/api/portraits/women/44.jpg',
  chidi: 'https://randomuser.me/api/portraits/men/75.jpg',
  amaka: 'https://randomuser.me/api/portraits/women/65.jpg',
  yusuf: 'https://randomuser.me/api/portraits/men/11.jpg',
  ngozi: 'https://randomuser.me/api/portraits/women/68.jpg',
  musa: 'https://randomuser.me/api/portraits/men/41.jpg',
  adaeze: 'https://randomuser.me/api/portraits/women/59.jpg',
  tunde: 'https://randomuser.me/api/portraits/men/22.jpg',
  halima: 'https://randomuser.me/api/portraits/women/90.jpg',
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
    update: { avatar: AVATARS[a.key] },
    create: {
      name: a.name, email: a.email, phone: a.phone, city: a.city,
      password: await bcrypt.hash('password123', 12), role: 'ARTISAN', avatar: AVATARS[a.key],
    },
  })
  return prisma.artisanProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id, profession: a.profession, category: a.category, bio: a.bio, hourlyRate: a.hourlyRate,
      verified: a.verified, available: a.available, avgRating: a.avgRating, totalReviews: a.totalReviews,
      approvalStatus: 'APPROVED', verificationStatus: 'VERIFIED',
    },
  })
}

async function main() {
  const password = await bcrypt.hash('password123', 12)

  // ── Admin ──
  await prisma.user.upsert({
    where: { email: 'admin@naijahandy.com' },
    update: {},
    create: { name: 'NaijaHandy Admin', email: 'admin@naijahandy.com', phone: '+234 800 000 0000', city: 'Lagos', password, role: 'ADMIN' },
  })

  // ── Customers ──
  const customer1 = await prisma.user.upsert({
    where: { email: 'chisom@example.com' },
    update: {},
    create: { name: 'Chisom Eze', email: 'chisom@example.com', phone: '+234 803 456 7890', city: 'Lagos', password, role: 'CUSTOMER' },
  })
  await prisma.user.upsert({
    where: { email: 'bayo@example.com' },
    update: {},
    create: { name: 'Bayo Adeleke', email: 'bayo@example.com', phone: '+234 802 345 6789', city: 'Abuja', password, role: 'CUSTOMER' },
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

  console.log('Database seeded successfully!')
  console.log('  Admin:     admin@naijahandy.com')
  console.log('  Customers: chisom@example.com / bayo@example.com')
  console.log(`  Artisans:  ${ARTISANS.map((a) => a.email).join(' / ')}`)
  console.log('  Password:  password123 (for all)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
