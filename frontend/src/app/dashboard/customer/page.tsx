'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, CheckCircle, CreditCard, TrendingUp, Heart, Settings, LogOut, Plus } from 'lucide-react'
import { fetchBookings, fetchMe, logout } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { Booking, BookingStatus } from '@/types'
import type { AuthUser } from '@/types'

const navItems = [
  { id: 'overview', label: 'Overview', icon: TrendingUp, href: '/dashboard/customer' },
  { id: 'bookings', label: 'My Bookings', icon: Calendar, href: '/bookings' },
  { id: 'saved', label: 'Saved Artisans', icon: Heart, href: '#' },
  { id: 'settings', label: 'Profile Settings', icon: Settings, href: '/settings' },
]

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    fetchBookings().then(setBookings).catch(() => setBookings([]))
    fetchMe().then(setUser).catch(() => setUser(null))
  }, [])

  const active = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending')
  const completed = bookings.filter((b) => b.status === 'Completed')
  const totalSpent = bookings.reduce((sum, b) => sum + b.amount, 0)
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
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
              <p className="text-xs text-gray-400">Customer</p>
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

      {/* Main */}
      <main className="flex-1 p-5 md:p-8 overflow-auto">
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
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Upcoming bookings */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Upcoming Bookings</h2>
              <Link href="/bookings" className="text-sm font-medium text-[#047857]">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {active.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                  <Image src={b.avatar} alt={b.artisan} width={44} height={44} className="rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{b.artisan}</p>
                    <p className="text-xs text-gray-400">{b.profession} · {b.date} at {b.time}</p>
                  </div>
                  <StatusBadge status={b.status as BookingStatus} />
                  <p className="font-semibold text-gray-900 text-sm shrink-0">{formatNGN(b.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
