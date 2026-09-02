'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, MessageSquare, Star, Plus, CreditCard, CheckCircle2, AlertCircle, Flag, Trash2, RefreshCw, ShieldCheck, Flame, Coins } from 'lucide-react'
import { fetchBookings, initializePayment, verifyPayment, updateBookingStatus, raiseDispute, createReview, fetchMyCredits } from '@/lib/api'
import { formatNGN, getApiErrorMessage } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import BackToDashboard from '@/components/BackToDashboard'
import FilterTabs from '@/components/ui/FilterTabs'
import SkeletonCard from '@/components/ui/SkeletonCard'
import EmptyState from '@/components/ui/EmptyState'
import CancelBookingModal from '@/components/bookings/CancelBookingModal'
import PayBookingModal from '@/components/bookings/PayBookingModal'
import DisputeBookingModal from '@/components/bookings/DisputeBookingModal'
import ReviewBookingModal from '@/components/bookings/ReviewBookingModal'
import type { Booking, BookingStatus, CreditWallet } from '@/types'

type FilterTab = 'All' | 'Active' | 'Urgent' | 'Rejected' | 'Completed' | 'Cancelled'

const TABS: FilterTab[] = ['All', 'Active', 'Urgent', 'Rejected', 'Completed', 'Cancelled']

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [payFor, setPayFor] = useState<Booking | null>(null)
  const [applyCredits, setApplyCredits] = useState(false)
  const [wallet, setWallet] = useState<CreditWallet | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState<Booking | null>(null)
  const [disputeFor, setDisputeFor] = useState<Booking | null>(null)
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [reviewFor, setReviewFor] = useState<Booking | null>(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const loadBookings = () => {
    setLoading(true)
    setLoadError('')
    fetchBookings()
      .then(setBookings)
      .catch((err) => {
        setBookings([])
        setLoadError(getApiErrorMessage(err, 'Could not load your bookings. Please try again.'))
      })
      .finally(() => setLoading(false))
  }

  const loadWallet = () => {
    fetchMyCredits().then(setWallet).catch(() => setWallet(null))
  }

  useEffect(() => {
    loadBookings()
    loadWallet()

    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference')
    if (reference) {
      verifyPayment(reference)
        .then(() => {
          setPaymentMsg({ type: 'success', text: 'Payment successful — your booking is now paid.' })
          loadBookings()
          loadWallet()
        })
        .catch(() => setPaymentMsg({ type: 'error', text: 'Payment could not be verified. Contact support if you were charged.' }))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handlePay = async () => {
    if (!payFor) return
    setPayingId(payFor.id)
    const credits = applyCredits ? Math.min(wallet?.balance ?? 0, payFor.amount) : 0
    try {
      const { authorization_url } = await initializePayment(payFor.id, credits)
      window.location.href = authorization_url
    } catch {
      setPayingId(null)
      setPaymentMsg({ type: 'error', text: 'Could not start payment. Please try again.' })
    }
  }

  const handleCancel = async () => {
    if (!cancelConfirm) return
    setCancellingId(cancelConfirm.id)
    try {
      await updateBookingStatus(cancelConfirm.id, 'CANCELLED')
      setCancelConfirm(null)
      setBookings((bs) => bs.map((b) => (b.id === cancelConfirm.id ? { ...b, status: 'Cancelled' } : b)))
    } catch (err) {
      setPaymentMsg({ type: 'error', text: getApiErrorMessage(err, 'Could not cancel the booking.') })
      setCancelConfirm(null)
    } finally {
      setCancellingId(null)
    }
  }

  const handleDispute = async (reason: string) => {
    if (!disputeFor) return
    setDisputeSubmitting(true)
    try {
      await raiseDispute(disputeFor.id, reason)
      setDisputeFor(null)
      setPaymentMsg({ type: 'success', text: 'Dispute raised — our team will review it shortly.' })
    } catch (err) {
      setPaymentMsg({ type: 'error', text: getApiErrorMessage(err, 'Could not raise the dispute. Please try again.') })
    } finally {
      setDisputeSubmitting(false)
    }
  }

  const handleReview = async (rating: number, comment: string, photoUrl: string) => {
    if (!reviewFor) return
    setReviewSubmitting(true)
    try {
      await createReview(reviewFor.id, rating, comment, photoUrl || undefined)
      setBookings((bs) => bs.map((b) => (b.id === reviewFor.id ? { ...b, reviewed: true } : b)))
      setReviewFor(null)
      setPaymentMsg({ type: 'success', text: 'Thanks! Your review has been published.' })
    } catch (err) {
      setPaymentMsg({ type: 'error', text: getApiErrorMessage(err, 'Could not submit your review. Please try again.') })
    } finally {
      setReviewSubmitting(false)
    }
  }

  const tabCounts = {
    All: bookings.length,
    Active: bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending').length,
    Urgent: bookings.filter((b) => b.isUrgent).length,
    Rejected: bookings.filter((b) => b.status === 'Rejected').length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    Cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
  }

  const filtered = bookings.filter((b) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Active') return b.status === 'Confirmed' || b.status === 'Pending'
    if (activeTab === 'Urgent') return b.isUrgent
    return b.status === activeTab
  })

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <BackToDashboard href="/dashboard/customer" />
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
          <div
            role="status"
            className={`mb-6 flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-3 ${paymentMsg.type === 'success' ? 'text-emerald-800 bg-emerald-50 border border-emerald-100' : 'text-red-800 bg-red-50 border border-red-100'}`}
          >
            {paymentMsg.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" /> : <AlertCircle size={16} className="shrink-0" aria-hidden="true" />}
            {paymentMsg.text}
          </div>
        )}

        {/* Rewards (loyalty credits) */}
        {wallet && (
          <div className="mb-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#047857] flex items-center justify-center shrink-0">
                  <Coins size={20} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Rewards credits</p>
                  <p className="text-xs text-gray-500">Earn 5% back on every completed booking</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-[#047857]">{formatNGN(wallet.balance)}</p>
                <p className="text-xs text-gray-500">Available to use on your next booking</p>
              </div>
            </div>
            {wallet.transactions.length > 0 && (
              <ul className="mt-4 pt-4 border-t border-emerald-100 divide-y divide-emerald-50">
                {wallet.transactions.slice(0, 4).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="text-gray-700 font-medium truncate">{t.note || (t.type === 'EARNED' ? 'Reward earned' : 'Credits used')}</p>
                      <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`shrink-0 font-semibold ${t.amount > 0 ? 'text-[#047857]' : 'text-gray-600'}`}>
                      {t.amount > 0 ? '+' : ''}{formatNGN(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loadError && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-2 text-sm font-medium text-red-800 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <span className="flex items-center gap-2"><AlertCircle size={16} className="shrink-0" aria-hidden="true" />{loadError}</span>
            <button onClick={loadBookings} className="shrink-0 px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <FilterTabs
          items={TABS}
          active={activeTab}
          onChange={(t) => setActiveTab(t as FilterTab)}
          ariaLabel="Filter bookings"
          className="mb-6"
          baseClassName="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors"
          renderLabel={(t, isActive) => (
            <>
              {t}
              <span className={`text-xs rounded-full px-1.5 ${isActive ? 'bg-white text-[#065f46]' : 'bg-gray-100 text-gray-700'}`}>{tabCounts[t as FilterTab]}</span>
            </>
          )}
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
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState
              icon={Calendar}
              title={`No ${activeTab.toLowerCase() === 'all' ? '' : activeTab.toLowerCase() + ' '}bookings here yet`}
              action={
                <Link href="/search" className="inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857]">
                  Find an Artisan
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <Image src={b.avatar || DEFAULT_AVATAR} alt={b.artisan} width={48} height={48} className="rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900">{b.artisan}</p>
                        <p className="text-sm text-gray-500">{b.profession}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.isUrgent && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <Flame size={12} aria-hidden="true" />Urgent
                          </span>
                        )}
                        <StatusBadge status={b.status as BookingStatus} />
                        {b.paymentStatus === 'REFUNDED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Refunded</span>
                        ) : b.paymentStatus === 'PAID' ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.escrowStatus === 'HELD' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {b.escrowStatus === 'HELD' ? 'Paid — held in escrow' : 'Paid — released'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Unpaid</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={13} />{b.date}</span>
                      <span className="flex items-center gap-1"><Clock size={13} />{b.time}</span>
                      <span className="font-semibold text-gray-900">{formatNGN(b.amount)}</span>
                    </div>
                    {b.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{b.description}</p>
                    )}
                    {b.paymentStatus === 'PAID' && b.escrowStatus === 'HELD' && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                        <ShieldCheck size={13} aria-hidden="true" /> Payment held in escrow — released to the artisan when the job is completed.
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Link
                        href={`/artisans/${b.artisanId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare size={13} />View Profile
                      </Link>
                      {b.status === 'Completed' && !b.reviewed && (
                        <button
                          onClick={() => { setReviewFor(b) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <Star size={13} />Leave Review
                        </button>
                      )}
                      {b.status === 'Completed' && b.reviewed && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2 size={13} />Reviewed
                        </span>
                      )}
                      {b.status === 'Completed' && (
                        <Link
                          href={`/artisans/${b.artisanId}?bookagain=1&time=${encodeURIComponent(b.time)}&desc=${encodeURIComponent(b.description || '')}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#047857]/30 rounded-lg text-[#047857] hover:bg-[#047857]/5 transition-colors"
                        >
                          <RefreshCw size={13} />Book Again
                        </Link>
                      )}
                      {b.status === 'Pending' && (
                        <button
                          onClick={() => setCancelConfirm(b)}
                          disabled={cancellingId === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} />Cancel Booking
                        </button>
                      )}
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => setCancelConfirm(b)}
                          disabled={cancellingId === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} />Cancel Booking
                        </button>
                      )}
                      {b.status === 'Confirmed' || b.status === 'Completed' ? (
                        <button
                          onClick={() => { setDisputeFor(b) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Flag size={13} />Raise Dispute
                        </button>
                      ) : null}
                      {b.paymentStatus === 'UNPAID' && b.status === 'Pending' && (
                        <button
                          onClick={() => { setPayFor(b); setApplyCredits(false) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity"
                        >
                          <CreditCard size={13} />Pay Now
                        </button>
                      )}
                      <Link
                        href={`/artisans/${b.artisanId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#047857] bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        Rebook
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {cancelConfirm && (
        <CancelBookingModal
          booking={cancelConfirm}
          cancelling={cancellingId === cancelConfirm.id}
          onCancel={handleCancel}
          onClose={() => setCancelConfirm(null)}
        />
      )}

      {/* Payment modal */}
      {payFor && (
        <PayBookingModal
          booking={payFor}
          wallet={wallet}
          applyCredits={applyCredits}
          onApplyCreditsChange={setApplyCredits}
          paying={payingId === payFor.id}
          onPay={handlePay}
          onClose={() => setPayFor(null)}
        />
      )}

      {/* Dispute modal */}
      {disputeFor && (
        <DisputeBookingModal
          booking={disputeFor}
          submitting={disputeSubmitting}
          onSubmit={handleDispute}
          onClose={() => setDisputeFor(null)}
        />
      )}
      {/* Review modal */}
      {reviewFor && (
        <ReviewBookingModal
          booking={reviewFor}
          submitting={reviewSubmitting}
          onSubmit={handleReview}
          onClose={() => setReviewFor(null)}
        />
      )}
    </div>
    </AuthGuard>
  )
}
