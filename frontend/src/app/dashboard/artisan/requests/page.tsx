'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Briefcase, Calendar, Clock, MapPin, Phone, Flame } from 'lucide-react'
import { fetchBookings, updateBookingStatus } from '@/lib/api'
import { DEFAULT_AVATAR } from '@/lib/data'
import { formatNGN } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import FilterTabs from '@/components/ui/FilterTabs'
import SkeletonCard from '@/components/ui/SkeletonCard'
import EmptyState from '@/components/ui/EmptyState'
import type { Booking, BookingStatus } from '@/types'

const REQUEST_TABS = ['All', 'Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled'] as const
type FilterTab = (typeof REQUEST_TABS)[number]

export default function JobRequestsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchBookings().then(setBookings).catch(() => setBookings([])).finally(() => setLoading(false))
  }, [])

  const respond = async (id: string, status: string) => {
    try {
      await updateBookingStatus(id, status)
      setBookings((bs) => bs.filter((b) => b.id !== id))
    } catch {}
  }

  const counts = {
    All: bookings.length,
    Pending: bookings.filter((b) => b.status === 'Pending').length,
    Confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    Rejected: bookings.filter((b) => b.status === 'Rejected').length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    Cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
  }

  const filtered = bookings
    .filter((b) => activeTab === 'All' || b.status === activeTab)
    .sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent))

  return (
    <>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-gray-900">Job Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">Review and manage bookings from customers</p>
      </div>

      {/* Filter tabs */}
      <FilterTabs
        items={REQUEST_TABS}
        active={activeTab}
        onChange={(t) => setActiveTab(t as FilterTab)}
        className="mb-6"
        renderLabel={(t) => `${t} (${counts[t as FilterTab]})`}
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <Image
                  src={b.customerAvatar || DEFAULT_AVATAR}
                  alt={b.customer || 'Customer'}
                  width={48}
                  height={48}
                  className="rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-900">{b.customer || 'Customer'}</p>
                      <p className="text-sm text-gray-500">{b.description || b.profession}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.isUrgent && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <Flame size={12} aria-hidden="true" />Urgent
                        </span>
                      )}
                      <StatusBadge status={b.status as BookingStatus} />
                      {b.paymentStatus === 'PAID' && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.escrowStatus === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {b.escrowStatus === 'RELEASED' ? 'Released' : 'Held in escrow'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={13} />{b.date}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{b.time}</span>
                    <span className="font-semibold text-gray-900">{formatNGN(b.amount)}</span>
                  </div>
                  {(b.customerPhone || b.address) && (
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm text-gray-600">
                      {b.customerPhone && (
                        <a href={`tel:${b.customerPhone.replace(/\D/g, '')}`} className="flex items-center gap-1 text-[#047857] hover:underline">
                          <Phone size={13} aria-hidden="true" />{b.customerPhone}
                        </a>
                      )}
                      {b.address && (
                        <span className="flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{b.address}</span>
                      )}
                    </div>
                  )}
                  {b.status === 'Pending' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => respond(b.id, 'REJECTED')} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                        Decline
                      </button>
                      <button onClick={() => respond(b.id, 'CONFIRMED')} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity">
                        Accept Job
                      </button>
                    </div>
                  )}
                  {b.status === 'Confirmed' && (
                    <button onClick={() => respond(b.id, 'COMPLETED')} className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:opacity-90 transition-opacity">
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <EmptyState
                icon={Briefcase}
                title={`No ${activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}job requests here yet`}
                description="New booking requests will appear here."
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
