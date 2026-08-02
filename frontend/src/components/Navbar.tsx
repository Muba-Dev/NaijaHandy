'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Menu, X, LogOut } from 'lucide-react'
import Brand from '@/components/Brand'
import { logout } from '@/lib/api'
import { getStoredUser, isAuthenticated } from '@/lib/utils'
import type { AuthUser } from '@/types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser<AuthUser>())
    } else {
      setUser(null)
    }
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setMobileOpen(false)
    router.push('/')
  }

  const dashboardHref = user?.role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer'

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
          {user ? (
            <>
              <Link href={dashboardHref} className="text-sm font-medium text-gray-700 hover:text-[#047857] px-3 py-1.5 transition-colors">
                Dashboard
              </Link>
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <Image
                  src={user.avatar || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=32&h=32&fit=crop&auto=format'}
                  alt={user.name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-2 py-1.5 transition-colors"
              >
                <LogOut size={15} /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5">
                Log In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg bg-[#047857] hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </>
          )}
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
          {user ? (
            <div className="flex gap-2 pt-2">
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg py-2 text-center"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 text-sm font-medium text-red-600 border border-red-200 rounded-lg py-2 text-center"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg py-2 text-center">
                Log In
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-sm font-semibold text-white rounded-lg py-2 text-center bg-[#047857]">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
