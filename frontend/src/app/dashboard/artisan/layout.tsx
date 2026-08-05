'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TrendingUp, Briefcase, Calendar, CreditCard, Settings, LogOut } from 'lucide-react'
import { fetchMyArtisanProfile, logout } from '@/lib/api'
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
              src={artisan?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format'}
              alt={artisan?.name || 'Artisan'}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{artisan?.name || 'Loading…'}</p>
              <p className="text-xs text-gray-400">{artisan?.profession || 'Artisan'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={16} />
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
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-semibold text-gray-900 text-sm">{artisan?.name || 'Artisan Dashboard'}</p>
          <button onClick={async () => { await logout(); router.push('/login') }} className="flex items-center gap-1.5 text-sm text-gray-600">
            <LogOut size={16} /> Log Out
          </button>
        </div>
        <nav className="flex gap-1 px-2 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={13} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main */}
      <main className="flex-1 p-5 md:p-8 overflow-auto pt-24 md:pt-8">
        <div className="max-w-4xl mx-auto md:mx-0">{children}</div>
      </main>
    </div>
    </AuthGuard>
  )
}
