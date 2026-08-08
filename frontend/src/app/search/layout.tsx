import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Artisans',
  description:
    'Search and filter trusted, verified Nigerian artisans by profession, city, rating, and availability.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Find Artisans in Nigeria',
    description: 'Search verified plumbers, electricians, carpenters and more near you.',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
