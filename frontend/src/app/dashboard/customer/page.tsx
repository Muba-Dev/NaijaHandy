'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, CheckCircle, CreditCard, TrendingUp, Heart, Settings, LogOut, Plus } from 'lucide-react'
import { fetchBookings, fetchMe, logout } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import type { Booking, BookingStatus } from '@/types'
import type { AuthUser } from '@/types'

const navItems = [
  { id: 'overview', label: 'Overview', icon: TrendingUp, href: '/dashboard/customer' },
  { id: 'bookings', label: 'My Bookings', icon: Calendar, href: '/bookings' },
  { id: 'saved', label: 'Saved Artisans', icon: Heart, href: '/saved' },
  { id: 'settings', label: 'Profile Settings', icon: Settings, href: '/settings' },
]

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchBookings().catch(() => []),
      fetchMe().catch(() => null),
    ]).then(([b, u]) => {
      if (!active) return
      setBookings(b)
      setUser(u)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const active = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending')
  const completed = bookings.filter((b) => b.status === 'Completed')
  const totalSpent = bookings.reduce((sum, b) => sum + b.amount, 0)
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src={user?.avatar || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=48&h=48&fit=crop&auto=format'}
              alt={user?.name || 'User'}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.name || 'Loading…'}</p>
              <p className="text-xs text-gray-500">Customer</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === 'overview'
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
          <p className="font-semibold text-gray-900 text-sm">{user?.name || 'Dashboard'}</p>
          <button onClick={async () => { await logout(); router.push('/login') }} className="flex items-center gap-1.5 text-sm text-gray-600">
            <LogOut size={16} /> Log Out
          </button>
        </div>
        <nav className="flex gap-1 px-2 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === 'overview'
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
      <div className="flex-1 p-5 md:p-8 overflow-auto pt-24 md:pt-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Good morning, {firstName} 👋</h1>
              <p className="text-gray-500 text-sm mt-0.5">Here&apos;s what&apos;s happening with your bookings.</p>
            </div>
            <Link
              href="/search"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857]"
            >
              <Plus size={16} /> Book Artisan
            </Link>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                  <div className="h-7 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Active Bookings', value: String(active.length), sub: active.length ? `${active.filter(b => b.status === 'Confirmed').length} confirmed, ${active.filter(b => b.status === 'Pending').length} pending` : 'No active bookings', icon: Calendar, color: '#047857' },
                { label: 'Completed Jobs', value: String(completed.length), sub: 'All time', icon: CheckCircle, color: '#2563EB' },
                { label: 'Total Spent', value: formatNGN(totalSpent), sub: 'All time', icon: CreditCard, color: '#F59E0B' },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-500">{s.label}</p>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                        <Icon size={16} style={{ color: s.color }} />
                      </div>
                    </div>
                    <p className="font-display text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Upcoming bookings */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Upcoming Bookings</h2>
              <Link href="/bookings" className="text-sm font-medium text-[#047857]">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : active.length === 0 ? (
                <div className="text-center py-12 px-5">
                  <Calendar size={36} className="text-gray-200 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-gray-600 font-medium text-sm">No upcoming bookings</p>
                  <p className="text-xs text-gray-500 mt-1">Book an artisan and your upcoming jobs will appear here.</p>
                  <Link href="/search" className="mt-4 inline-block px-4 py-2 rounded-xl text-white text-xs font-semibold bg-[#047857] hover:opacity-90 transition-opacity">
                    Find an Artisan
                  </Link>
                </div>
              ) : active.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                  <Image src={b.avatar || DEFAULT_AVATAR} alt={b.artisan} width={44} height={44} className="rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{b.artisan}</p>
                    <p className="text-xs text-gray-500">{b.profession} · {b.date} at {b.time}</p>
                  </div>
                  <StatusBadge status={b.status as BookingStatus} />
                  <p className="font-semibold text-gray-900 text-sm shrink-0">{formatNGN(b.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
