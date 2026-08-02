'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, MessageSquare, Star, Plus, CreditCard, CheckCircle2 } from 'lucide-react'
import { fetchBookings, initializePayment, verifyPayment } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import type { Booking, BookingStatus } from '@/types'

type FilterTab = 'All' | 'Active' | 'Completed' | 'Cancelled'

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentMsg, setPaymentMsg] = useState('')

  const loadBookings = () => {
    setLoading(true)
    fetchBookings().then(setBookings).catch(() => setBookings([])).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBookings()

    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference')
    if (reference) {
      verifyPayment(reference)
        .then(() => {
          setPaymentMsg('Payment successful — your booking is now paid.')
          loadBookings()
        })
        .catch(() => setPaymentMsg('Payment could not be verified. Contact support if you were charged.'))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handlePay = async (b: Booking) => {
    setPayingId(b.id)
    try {
      const { authorization_url } = await initializePayment(b.id)
      window.location.href = authorization_url
    } catch {
      setPayingId(null)
    }
  }

  const filtered = bookings.filter((b) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Active') return b.status === 'Confirmed' || b.status === 'Pending'
    return b.status === activeTab
  })

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Booking History</h1>
            <p className="text-gray-500 text-sm mt-0.5">All your past and upcoming bookings</p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> New Booking
          </Link>
        </div>

        {paymentMsg && (
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0" /> {paymentMsg}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['All', 'Active', 'Completed', 'Cancelled'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === t ? 'text-white bg-[#047857]' : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <>
          <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <Image src={b.avatar} alt={b.artisan} width={48} height={48} className="rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-900">{b.artisan}</p>
                      <p className="text-sm text-gray-500">{b.profession}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status as BookingStatus} />
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={13} />{b.date}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{b.time}</span>
                    <span className="font-semibold text-gray-900">{formatNGN(b.amount)}</span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                      <MessageSquare size={13} />Message
                    </button>
                    {b.status === 'Completed' && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Star size={13} />Leave Review
                      </button>
                    )}
                    {b.paymentStatus === 'UNPAID' && (
                      <button
                        onClick={() => handlePay(b)}
                        disabled={payingId === b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <CreditCard size={13} />{payingId === b.id ? 'Redirecting…' : 'Pay Now'}
                      </button>
                    )}
                    <Link
                      href={`/artisans/${b.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#047857] bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      Rebook
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bookings here yet</p>
              <Link href="/search" className="mt-3 inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857]">
                Find an Artisan
              </Link>
            </div>
          )}
          </div>
          </>
          )}
      </div>
    </div>
    </AuthGuard>
  )
}
