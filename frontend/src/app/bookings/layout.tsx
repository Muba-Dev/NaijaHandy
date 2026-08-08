import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Bookings',
  description: 'View and manage your booking history with NaijaHandy artisans.',
  robots: { index: false, follow: false },
}

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
