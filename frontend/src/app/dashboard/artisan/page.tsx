'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Briefcase, Calendar, CreditCard, Bell, Users, CheckCircle, MapPin, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import { fetchMyArtisanProfile, fetchBookings, updateArtisanProfile, updateBookingStatus } from '@/lib/api'
import { DEFAULT_AVATAR } from '@/lib/data'
import { formatNGN } from '@/lib/utils'
import type { Artisan, Booking } from '@/types'

export default function ArtisanOverviewPage() {
  const [available, setAvailable] = useState(true)
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMyArtisanProfile().then((p) => { setArtisan(p); setAvailable(p.available) }).catch(() => setArtisan(null)),
      fetchBookings().then(setBookings).catch(() => setBookings([])),
    ]).finally(() => setLoading(false))
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
  const upcoming = bookings.filter((b) => b.status === 'Confirmed').slice(0, 3)

  return (
    <>
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Artisan Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your jobs and schedule</p>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-2.5">
          <span className="text-sm font-medium text-gray-700" id="availability-label">Available for Work</span>
          <button
            onClick={toggleAvailability}
            aria-label={available ? 'Turn availability off' : 'Turn availability on'}
            aria-pressed={available}
            aria-labelledby="availability-label"
            className="p-1 -m-1"
          >
            {available
              ? <ToggleRight size={28} className="text-[#047857]" aria-hidden="true" />
              : <ToggleLeft size={28} className="text-gray-500" aria-hidden="true" />
            }
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-2/3" />
            </div>
          ))
        ) : [
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
                <Icon size={14} className="text-[#047857]" aria-hidden="true" />
              </div>
              <p className="font-display text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Job requests */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Job Requests Pending Approval</h2>
          <Link href="/dashboard/artisan/requests" className="flex items-center gap-1 text-sm font-medium text-[#047857]">
            View all <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : pendingRequests.map((r) => (
            <div key={r.id} className="flex items-start gap-4 px-5 py-4">
              <Image src={r.customerAvatar || DEFAULT_AVATAR} alt={r.customer || 'Customer'} width={40} height={40} className="rounded-xl object-cover shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{r.customer || r.artisan}</p>
                  <span className="text-xs text-gray-500">{r.date} · {r.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{r.description || r.profession}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} aria-hidden="true" />Job Request</span>
                  <span className="text-xs font-semibold text-[#047857]">{formatNGN(r.amount)}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => respond(r.id, 'REJECTED')} className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  Decline
                </button>
                <button onClick={() => respond(r.id, 'CONFIRMED')} className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity">
                  Accept
                </button>
              </div>
            </div>
          ))}
          {!loading && pendingRequests.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No pending job requests.</p>
          )}
        </div>
      </div>

      {/* Upcoming jobs */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upcoming Confirmed Jobs</h2>
          <Link href="/dashboard/artisan/schedule" className="flex items-center gap-1 text-sm font-medium text-[#047857]">
            My schedule <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : upcoming.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-[#047857]/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[#047857]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{b.customer || 'Customer'}</p>
                <p className="text-xs text-gray-500">{b.date} at {b.time}</p>
              </div>
              <p className="font-semibold text-gray-900 text-sm shrink-0">{formatNGN(b.amount)}</p>
            </div>
          ))}
          {!loading && upcoming.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">No confirmed jobs yet. Check your job requests.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'View Earnings', desc: 'Track your completed jobs and income', href: '/dashboard/artisan/earnings', icon: CreditCard },
          { title: 'Edit My Profile', desc: 'Update your bio, rate and availability', href: '/dashboard/artisan/profile', icon: Briefcase },
        ].map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.title} href={c.href} className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#047857]/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#047857]/10 flex items-center justify-center">
                  <Icon size={18} className="text-[#047857]" />
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#047857] transition-colors" aria-hidden="true" />
              </div>
              <p className="font-semibold text-gray-900 mt-4">{c.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.desc}</p>
            </Link>
          )
        })}
      </div>
    </>
  )
}
