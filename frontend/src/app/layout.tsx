import type { Metadata } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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
  title: 'NaijaHandy — Find Trusted Local Artisans Near You',
  description: "Nigeria's trusted marketplace for finding skilled local artisans.",
  keywords: ['artisan', 'Nigeria', 'plumber', 'electrician', 'carpenter', 'handyman'],
  icons: { icon: '/favicon.svg' },
}

const NO_FOOTER_ROUTES = ['/login', '/register', '/dashboard/customer', '/dashboard/artisan']

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
