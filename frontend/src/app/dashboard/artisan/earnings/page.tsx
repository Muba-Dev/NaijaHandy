'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CreditCard, TrendingUp, CheckCircle, Users, Calendar } from 'lucide-react'
import { fetchMyArtisanProfile, fetchBookings } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import type { Artisan, Booking } from '@/types'

export default function EarningsPage() {
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    fetchMyArtisanProfile().then(setArtisan).catch(() => setArtisan(null))
    fetchBookings().then(setBookings).catch(() => setBookings([]))
  }, [])

  const completed = bookings.filter((b) => b.status === 'Completed')
  const totalEarnings = completed.reduce((s, b) => s + b.amount, 0)

  const now = new Date()
  const thisMonth = completed.filter((b) => {
    const d = new Date(b.dateISO)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthEarnings = thisMonth.reduce((s, b) => s + b.amount, 0)

  const byMonth = completed.reduce<Record<string, { count: number; total: number }>>((acc, b) => {
    const key = new Date(b.dateISO).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
    acc[key] = acc[key] || { count: 0, total: 0 }
    acc[key].count += 1
    acc[key].total += b.amount
    return acc
  }, {})
  const monthTotals = Object.entries(byMonth).sort((a, b) => b[1].total - a[1].total)

  return (
    <>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your income from completed jobs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earnings', value: formatNGN(totalEarnings), sub: 'All time', icon: CreditCard, color: '#047857' },
          { label: 'This Month', value: formatNGN(thisMonthEarnings), sub: `${thisMonth.length} jobs`, icon: TrendingUp, color: '#2563EB' },
          { label: 'Jobs Completed', value: String(completed.length), sub: 'All time', icon: CheckCircle, color: '#F59E0B' },
          { label: 'Avg. Rating', value: artisan ? `${artisan.rating.toFixed(1)}★` : '—', sub: `${artisan?.reviews || 0} reviews`, icon: Users, color: '#8B5CF6' },
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

      {/* Completed jobs */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Completed Jobs</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {completed.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <Image
                src={b.customerAvatar || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=48&h=48&fit=crop&auto=format'}
                alt={b.customer || 'Customer'}
                width={40}
                height={40}
                className="rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{b.customer || 'Customer'}</p>
                <p className="text-xs text-gray-400">{b.date} · {b.time}</p>
              </div>
              <p className="font-semibold text-[#047857] text-sm shrink-0">{formatNGN(b.amount)}</p>
            </div>
          ))}
          {completed.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No completed jobs yet. Earnings appear here once jobs are completed.</p>
          )}
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Monthly Breakdown</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {monthTotals.map(([month, { count, total }]) => (
            <div key={month} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-[#047857]/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[#047857]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{month}</p>
                <p className="text-xs text-gray-400">{count} job{count === 1 ? '' : 's'} completed</p>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{formatNGN(total)}</p>
            </div>
          ))}
          {monthTotals.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No earnings data yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
