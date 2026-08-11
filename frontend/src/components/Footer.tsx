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

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="mb-4"><Brand compact dark /></div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Nigeria&apos;s premier platform for connecting skilled artisans with customers who need quality work done right.
          </p>
          <div className="flex gap-3 mt-5">
            {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#047857] transition-colors"
              >
                <Icon size={16} className="text-gray-300" />
              </a>
            ))}
          </div>
        </div>

        {/* Platform */}
        <nav aria-label="Platform">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Platform</h2>
          <ul className="space-y-2">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Categories */}
        <nav aria-label="Categories">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Categories</h2>
          <ul className="space-y-2">
            {CATEGORY_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Newsletter</h2>
          <p className="text-gray-300 text-sm mb-3">Get artisan tips and platform updates.</p>
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 px-6 py-5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-gray-400 text-sm">© 2026 NaijaHandy. All rights reserved.</p>
        <div className="flex gap-4">
          {['Privacy Policy', 'Terms of Service', 'Contact'].map((l) => (
            <span key={l} className="text-gray-400 text-sm">
              {l}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
