import Link from 'next/link'
import Brand from '@/components/Brand'
import NewsletterForm from '@/components/NewsletterForm'

function FacebookIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function XIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

const PLATFORM_LINKS = [
  { label: 'Find Artisans', href: '/search' },
  { label: 'Become an Artisan', href: '/register' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Service Guarantee', href: '/guarantee' },
  { label: 'Help Centre', href: '/help' },
]

const CATEGORY_LINKS = [
  { label: 'Plumbing', href: '/search?q=plumbing' },
  { label: 'Electrical', href: '/search?q=electrical' },
  { label: 'Carpentry', href: '/search?q=carpentry' },
  { label: 'Painting', href: '/search?q=painting' },
  { label: 'Auto Repair', href: '/search?q=auto%20repair' },
]

const SOCIAL_LINKS = [
  { label: 'NaijaHandy on Facebook', icon: FacebookIcon, href: 'https://facebook.com/naijahandy' },
  { label: 'NaijaHandy on Instagram', icon: InstagramIcon, href: 'https://instagram.com/naijahandy' },
  { label: 'NaijaHandy on X', icon: XIcon, href: 'https://x.com/naijahandy' },
]

const TRUST_POINTS = ['Background-checked pros', 'Escrow payments', 'Satisfaction guarantee']

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white mt-20">
      <div aria-hidden className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
        {/* Brand */}
        <div>
          <div className="mb-5"><Brand compact dark /></div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Nigeria&apos;s premier platform for connecting skilled artisans with customers who need quality work done right.
          </p>
          <div className="flex gap-3 mt-6">
            {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-300 ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Platform */}
        <nav aria-label="Platform">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80 mb-5">Platform</h2>
          <ul className="space-y-3">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Categories */}
        <nav aria-label="Categories">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80 mb-5">Categories</h2>
          <ul className="space-y-3">
            {CATEGORY_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80 mb-5">Newsletter</h2>
          <p className="text-gray-400 text-sm mb-4">Get artisan tips and platform updates.</p>
          <NewsletterForm />
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {TRUST_POINTS.map((point) => (
            <span key={point} className="inline-flex items-center gap-2 text-xs font-medium text-gray-400">
              <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              {point}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-sm">© 2026 NaijaHandy. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact'].map((l) => (
              <span key={l} className="text-gray-400 text-sm transition-colors hover:text-gray-300 cursor-pointer">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
