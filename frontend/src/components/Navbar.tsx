'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Menu, X, LogOut, Bell } from 'lucide-react'
import Brand from '@/components/Brand'
import { logout, fetchUnreadCount } from '@/lib/api'
import { getStoredUser, isAuthenticated } from '@/lib/utils'
import type { AuthUser } from '@/types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser<AuthUser>())
    } else {
      setUser(null)
      setUnread(0)
    }
  }, [pathname])

  useEffect(() => {
    if (!isAuthenticated()) return
    let cancelled = false
    const load = async () => {
      try {
        const count = await fetchUnreadCount()
        if (!cancelled) setUnread(count)
      } catch {
        if (!cancelled) setUnread(0)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pathname])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setMobileOpen(false)
    router.push('/')
  }

  const dashboardHref = user?.role === 'ADMIN' ? '/dashboard/admin' : user?.role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer'

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
          <form onSubmit={submitSearch} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-52">
            <Search size={14} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artisans…"
              aria-label="Search artisans"
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
            />
          </form>
          {user ? (
            <>
              <Link href="/notifications" aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`} className="relative p-2 text-gray-500 hover:text-[#047857] transition-colors">
                <Bell size={18} aria-hidden="true" />
                {unread > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link href={dashboardHref} className="text-sm font-medium text-gray-700 hover:text-[#047857] px-3 py-1.5 transition-colors">
                Dashboard
              </Link>
              {user.role === 'CUSTOMER' && (
                <>
                  <Link href="/bookings" className="text-sm font-medium text-gray-700 hover:text-[#047857] px-3 py-1.5 transition-colors">
                    Bookings
                  </Link>
                  <Link href="/saved" className="text-sm font-medium text-gray-700 hover:text-[#047857] px-3 py-1.5 transition-colors">
                    Saved
                  </Link>
                </>
              )}
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
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <form onSubmit={submitSearch} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2.5">
            <Search size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artisans…"
              aria-label="Search artisans"
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
            />
          </form>
          <Link href="/search" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2">
            Find Artisans
          </Link>
          <Link href="/dashboard/artisan" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2">
            Become an Artisan
          </Link>
          {user ? (
            <>
              {user.role === 'CUSTOMER' && (
                <>
                  <Link href="/bookings" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2">
                    Bookings
                  </Link>
                  <Link href="/saved" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2">
                    Saved
                  </Link>
                </>
              )}
              <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium text-gray-700 py-2">
                <Bell size={15} aria-hidden="true" />
                Notifications
                {unread > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
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
            </>
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
