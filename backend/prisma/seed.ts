import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 12)

  // ── Customers ──
  const customer1 = await prisma.user.upsert({
    where: { email: 'chisom@example.com' },
    update: {},
    create: { name: 'Chisom Eze', email: 'chisom@example.com', phone: '+234 803 456 7890', city: 'Lagos', password, role: 'CUSTOMER' },
  })
  const customer2 = await prisma.user.upsert({
    where: { email: 'bayo@example.com' },
    update: {},
    create: { name: 'Bayo Adeleke', email: 'bayo@example.com', phone: '+234 802 345 6789', city: 'Abuja', password, role: 'CUSTOMER' },
  })

  // ── Artisans ──
  const emekaUser = await prisma.user.upsert({
    where: { email: 'emeka@example.com' },
    update: {},
    create: {
      name: 'Emeka Okafor', email: 'emeka@example.com', phone: '+234 801 234 5678', city: 'Lagos, VI', password, role: 'ARTISAN',
    },
  })
  const emeka = await prisma.artisanProfile.upsert({
    where: { userId: emekaUser.id },
    update: {},
    create: {
      userId: emekaUser.id, profession: 'Master Plumber', category: 'Plumbing',
      bio: 'Over 12 years of experience fixing residential and commercial plumbing across Lagos. Specialise in pipe installations and emergency repairs.',
      hourlyRate: 8500, verified: true, available: true, avgRating: 4.9, totalReviews: 134,
    },
  })

  const fatimaUser = await prisma.user.upsert({
    where: { email: 'fatima@example.com' },
    update: {},
    create: {
      name: 'Fatima Aliyu', email: 'fatima@example.com', phone: '+234 802 345 6780', city: 'Abuja, Wuse', password, role: 'ARTISAN',
    },
  })
  const fatima = await prisma.artisanProfile.upsert({
    where: { userId: fatimaUser.id },
    update: {},
    create: {
      userId: fatimaUser.id, profession: 'Electrician', category: 'Electrical',
      bio: 'Certified electrical engineer with COREN accreditation. Residential wiring, industrial installations, and solar panel setups.',
      hourlyRate: 7500, verified: true, available: true, avgRating: 4.8, totalReviews: 89,
    },
  })

  const chidiUser = await prisma.user.upsert({
    where: { email: 'chidi@example.com' },
    update: {},
    create: {
      name: 'Chidi Nwosu', email: 'chidi@example.com', phone: '+234 803 456 7891', city: 'Port Harcourt', password, role: 'ARTISAN',
    },
  })
  const chidi = await prisma.artisanProfile.upsert({
    where: { userId: chidiUser.id },
    update: {},
    create: {
      userId: chidiUser.id, profession: 'Carpenter & Joiner', category: 'Carpentry',
      bio: 'Custom furniture design and woodworking for homes and offices. 9 years building bespoke pieces across the South-South.',
      hourlyRate: 6500, verified: true, available: false, avgRating: 4.7, totalReviews: 62,
    },
  })

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
  await prisma.booking.createMany({ data: [
    { customerId: customer1.id, artisanId: emeka.id, date: new Date('2026-07-30'), time: '9:00 AM', description: 'Fix leaking kitchen sink pipe', amount: 17000, status: 'CONFIRMED' },
    { customerId: customer1.id, artisanId: fatima.id, date: new Date('2026-08-02'), time: '2:00 PM', description: 'Install new electrical outlets in living room', amount: 15000, status: 'PENDING' },
    { customerId: customer1.id, artisanId: chidi.id, date: new Date('2026-07-19'), time: '10:00 AM', description: 'Build custom bookshelf', amount: 26000, status: 'COMPLETED' },
  ] })

  console.log('Database seeded successfully!')
  console.log('  Customers: chisom@example.com / bayo@example.com')
  console.log('  Artisans:  emeka@example.com / fatima@example.com / chidi@example.com')
  console.log('  Password:  password123 (for all)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
