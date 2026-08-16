'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TrendingUp, Briefcase, Calendar, CreditCard, Settings, LogOut } from 'lucide-react'
import Brand from '@/components/Brand'
import { fetchMyArtisanProfile, logout } from '@/lib/api'
import { DEFAULT_AVATAR } from '@/lib/data'
import AuthGuard from '@/components/AuthGuard'
import type { Artisan } from '@/types'

const navItems = [
  { id: 'overview', label: 'Overview', icon: TrendingUp, href: '/dashboard/artisan' },
  { id: 'requests', label: 'Job Requests', icon: Briefcase, href: '/dashboard/artisan/requests' },
  { id: 'schedule', label: 'My Schedule', icon: Calendar, href: '/dashboard/artisan/schedule' },
  { id: 'earnings', label: 'Earnings', icon: CreditCard, href: '/dashboard/artisan/earnings' },
  { id: 'profile', label: 'My Profile', icon: Settings, href: '/dashboard/artisan/profile' },
]

export default function ArtisanDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [artisan, setArtisan] = useState<Artisan | null>(null)

  useEffect(() => {
    fetchMyArtisanProfile().then(setArtisan).catch(() => setArtisan(null))
  }, [])

  return (
    <AuthGuard allowedRoles={['ARTISAN']}>
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src={artisan?.avatar || DEFAULT_AVATAR}
              alt={artisan?.name || 'Artisan'}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{artisan?.name || 'Loading…'}</p>
              <p className="text-xs text-gray-500">{artisan?.profession || 'Artisan'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Artisan dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={async () => { await logout(); router.push('/login') }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed top-0 inset-x-0 z-20 bg-white border-b border-gray-100 md:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
          <Brand compact />
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2.5 pl-1 pr-1">
              <Image
                src={artisan?.avatar || DEFAULT_AVATAR}
                alt=""
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
              <span className="text-sm font-medium text-gray-800">{artisan?.name?.split(' ')[0] || 'Artisan'}</span>
            </div>
            <button
              onClick={async () => { await logout(); router.push('/login') }}
              aria-label="Log out"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav className="flex gap-1 px-3 pt-2 pb-3 overflow-x-auto border-t border-gray-100" aria-label="Artisan dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-[#047857] bg-[#047857]/10' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={13} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-5 md:p-8 overflow-auto pt-28 md:pt-8">
        <div className="max-w-4xl mx-auto md:mx-0">{children}</div>
      </div>
    </div>
    </AuthGuard>
  )
}
