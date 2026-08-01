'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'
import Brand from '@/components/Brand'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Brand compact />

        {/* Center links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/search" className="text-sm font-medium text-gray-600 hover:text-[#047857] transition-colors">
            Find Artisans
          </Link>
          <Link href="/dashboard/artisan" className="text-sm font-medium text-gray-600 hover:text-[#047857] transition-colors">
            Become an Artisan
          </Link>
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-52">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              placeholder="Search artisans…"
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5">
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg bg-[#047857] hover:opacity-90 transition-opacity"
          >
            Register
          </Link>
        </div>

        {/* Mobile burger */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <Link href="/search" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2">
            Find Artisans
          </Link>
          <Link href="/dashboard/artisan" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2">
            Become an Artisan
          </Link>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg py-2 text-center">
              Log In
            </Link>
            <Link href="/register" className="flex-1 text-sm font-semibold text-white rounded-lg py-2 text-center bg-[#047857]">
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
