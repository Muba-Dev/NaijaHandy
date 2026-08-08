import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile Settings',
  description: 'Update your personal information, security, and notification preferences.',
  robots: { index: false, follow: false },
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
