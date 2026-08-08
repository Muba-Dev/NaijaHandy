import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signing In',
  description: 'Completing your sign-in to NaijaHandy.',
  robots: { index: false, follow: false },
}

export default function OAuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
