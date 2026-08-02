'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Briefcase, Calendar, CreditCard, Settings, LogOut, Bell, Users, CheckCircle, MapPin, ToggleLeft, ToggleRight, Plus } from 'lucide-react'
import { fetchMyArtisanProfile, fetchBookings, updateArtisanProfile, updateBookingStatus, logout } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import type { Artisan, Booking } from '@/types'

const navItems = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'requests', label: 'Job Requests', icon: Briefcase },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
  { id: 'earnings', label: 'Earnings', icon: CreditCard },
  { id: 'profile', label: 'My Profile', icon: Settings },
]

export default function ArtisanDashboardPage() {
  const router = useRouter()
  const [available, setAvailable] = useState(true)
  const [activeNav, setActiveNav] = useState('overview')
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    fetchMyArtisanProfile().then((p) => { setArtisan(p); setAvailable(p.available) }).catch(() => setArtisan(null))
    fetchBookings().then(setBookings).catch(() => setBookings([]))
  }, [])

  const toggleAvailability = async () => {
    const next = !available
    setAvailable(next)
    try { await updateArtisanProfile({ available: next }) } catch { setAvailable(!next) }
  }

  const respond = async (id: string, status: string) => {
    try {
      await updateBookingStatus(id, status)
      setBookings((bs) => bs.filter((b) => b.id !== id))
    } catch {}
  }

  const pendingRequests = bookings.filter((b) => b.status === 'Pending')
  const completedCount = bookings.filter((b) => b.status === 'Completed').length
  const totalEarnings = bookings.filter((b) => b.status === 'Completed').reduce((s, b) => s + b.amount, 0)

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image src={artisan?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format'} alt={artisan?.name || 'Artisan'} width={40} height={40} className="rounded-full object-cover" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{artisan?.name || 'Loading…'}</p>
              <p className="text-xs text-gray-400">{artisan?.profession || 'Artisan'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeNav === item.id ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={16} />
                {item.label}
              </button>
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
          <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Artisan Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">Manage your jobs and schedule</p>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700">Available for Work</span>
              <button onClick={toggleAvailability}>
                {available
                  ? <ToggleRight size={28} className="text-[#047857]" />
                  : <ToggleLeft size={28} className="text-gray-300" />
                }
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'This Month', value: formatNGN(totalEarnings), sub: 'Earnings', icon: TrendingUp },
              { label: 'Pending Requests', value: String(pendingRequests.length), sub: 'New jobs', icon: Bell },
              { label: 'Jobs Completed', value: String(completedCount), sub: 'All time', icon: CheckCircle },
              { label: 'Avg. Rating', value: artisan ? `${artisan.rating.toFixed(1)}★` : '—', sub: `${artisan?.reviews || 0} reviews`, icon: Users },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <Icon size={14} className="text-[#047857]" />
                  </div>
                  <p className="font-display text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Job requests */}
          <div className="bg-white rounded-2xl border border-gray-100 mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Job Requests Pending Approval</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingRequests.map((r) => (
                <div key={r.id} className="flex items-start gap-4 px-5 py-4">
                  <Image src={r.avatar} alt={r.artisan} width={40} height={40} className="rounded-xl object-cover shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{r.artisan}</p>
                      <span className="text-xs text-gray-400">{r.date} · {r.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{r.profession}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />Job Request</span>
                      <span className="text-xs font-semibold text-[#047857]">{formatNGN(r.amount)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => respond(r.id, 'CANCELLED')} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                      Decline
                    </button>
                    <button onClick={() => respond(r.id, 'CONFIRMED')} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity">
                      Accept
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No pending job requests.</p>
              )}
            </div>
          </div>

          {/* Calendar widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Upcoming Schedule — July 2026</h2>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                const booked = [30, 2, 12].includes(d)
                const today = d === 29
                return (
                  <button
                    key={d}
                    className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${today ? 'text-white bg-[#047857]' : booked ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#047857]" />Today</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100" />Booked</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
