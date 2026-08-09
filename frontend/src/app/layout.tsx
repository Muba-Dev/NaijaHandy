import type { Metadata, Viewport } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://naija-handy.vercel.app'

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-fraunces',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'NaijaHandy — Find Trusted Local Artisans in Nigeria',
    template: '%s | NaijaHandy',
  },
  description:
    "Nigeria's trusted marketplace for finding skilled local artisans. Connect with verified plumbers, electricians, carpenters and more near you. Safe payments, guaranteed quality.",
  keywords: ['artisan', 'Nigeria', 'plumber', 'electrician', 'carpenter', 'handyman', 'repairs', 'home services'],
  authors: [{ name: 'NaijaHandy' }],
  creator: 'NaijaHandy',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: '/',
    siteName: 'NaijaHandy',
    title: 'NaijaHandy — Find Trusted Local Artisans in Nigeria',
    description:
      "Nigeria's trusted marketplace for finding skilled local artisans. Verified plumbers, electricians, carpenters and more near you.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaijaHandy — Find Trusted Local Artisans in Nigeria',
    description:
      "Nigeria's trusted marketplace for finding skilled local artisans. Verified plumbers, electricians, carpenters and more near you.",
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-[#047857] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'NaijaHandy',
              url: APP_URL,
              description:
                "Nigeria's trusted marketplace for finding skilled local artisans. Connect with verified plumbers, electricians, carpenters and more near you.",
              areaServed: 'NG',
              sameAs: [],
            }),
          }}
        />
      </body>
    </html>
  )
}
