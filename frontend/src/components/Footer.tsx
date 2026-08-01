import Link from 'next/link'
import { Share2, Globe, AtSign } from 'lucide-react'
import Brand from '@/components/Brand'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="mb-4"><Brand compact /></div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Nigeria&apos;s premier platform for connecting skilled artisans with customers who need quality work done right.
          </p>
          <div className="flex gap-3 mt-5">
            {[Share2, Globe, AtSign].map((Icon, i) => (
              <button
                key={i}
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#047857] transition-colors"
              >
                <Icon size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Platform</h4>
          <ul className="space-y-2">
            {['Find Artisans', 'Become an Artisan', 'How It Works', 'Pricing'].map((l) => (
              <li key={l}>
                <Link href="/search" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Categories</h4>
          <ul className="space-y-2">
            {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Auto Repair'].map((l) => (
              <li key={l}>
                <Link href="/search" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Newsletter</h4>
          <p className="text-gray-400 text-sm mb-3">Get artisan tips and platform updates.</p>
          <div className="flex gap-2">
            <input
              placeholder="you@email.com"
              className="flex-1 bg-gray-800 text-sm text-white placeholder-gray-500 rounded-lg px-3 py-2 outline-none border border-gray-700 focus:border-[#047857]"
            />
            <button className="px-3 py-2 rounded-lg text-white font-semibold text-sm bg-[#047857] hover:opacity-90">
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 px-6 py-5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-gray-500 text-sm">© 2026 NaijaHandy. All rights reserved.</p>
        <div className="flex gap-4">
          {['Privacy Policy', 'Terms of Service', 'Contact'].map((l) => (
            <Link key={l} href="#" className="text-gray-500 hover:text-gray-300 text-sm">
              {l}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
