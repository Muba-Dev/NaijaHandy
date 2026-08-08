import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saved Artisans',
  description: 'Artisans you have bookmarked for later.',
  robots: { index: false, follow: false },
}

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
