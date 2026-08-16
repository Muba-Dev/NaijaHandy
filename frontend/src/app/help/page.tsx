import { fetchHelpArticles } from '@/lib/api'
import { FALLBACK_SECTIONS } from './fallback-articles'
import HelpContent from './HelpContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Centre',
  description:
    'Find quick answers about booking, payments, verification, disputes and the NaijaHandy Guarantee — or send our support team a message.',
  robots: { index: true, follow: true },
}

export default async function HelpPage() {
  const sections = await fetchHelpArticles().catch(() => [])
  return <HelpContent sections={sections.length > 0 ? sections : FALLBACK_SECTIONS} />
}
