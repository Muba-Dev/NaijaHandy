'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, MessageSquare, Star, Plus, CreditCard, CheckCircle2, AlertCircle, X, Flag, Trash2, Camera, RefreshCw, ShieldCheck, Flame } from 'lucide-react'
import { fetchBookings, initializePayment, verifyPayment, updateBookingStatus, raiseDispute, createReview } from '@/lib/api'
import { formatNGN, getApiErrorMessage } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import BackToDashboard from '@/components/BackToDashboard'
import type { Booking, BookingStatus } from '@/types'

type FilterTab = 'All' | 'Active' | 'Urgent' | 'Rejected' | 'Completed' | 'Cancelled'

const TABS: FilterTab[] = ['All', 'Active', 'Urgent', 'Rejected', 'Completed', 'Cancelled']

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState<Booking | null>(null)
  const [disputeFor, setDisputeFor] = useState<Booking | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [disputeError, setDisputeError] = useState('')
  const [reviewFor, setReviewFor] = useState<Booking | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const reviewPhotoInputRef = useRef<HTMLInputElement>(null)

  const readPhotoAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Could not read the file'))
      reader.readAsDataURL(file)
    })

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

  useEffect(() => {
    loadBookings()

    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference')
    if (reference) {
      verifyPayment(reference)
        .then(() => {
          setPaymentMsg({ type: 'success', text: 'Payment successful — your booking is now paid.' })
          loadBookings()
        })
        .catch(() => setPaymentMsg({ type: 'error', text: 'Payment could not be verified. Contact support if you were charged.' }))
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

  const handleDispute = async () => {
    if (!disputeFor) return
    setDisputeSubmitting(true)
    setDisputeError('')
    try {
      await raiseDispute(disputeFor.id, disputeReason)
      setDisputeFor(null)
      setDisputeReason('')
      setPaymentMsg({ type: 'success', text: 'Dispute raised — our team will review it shortly.' })
    } catch (err) {
      setDisputeError(getApiErrorMessage(err, 'Could not raise the dispute. Please try again.'))
    } finally {
      setDisputeSubmitting(false)
    }
  }

  const handleReview = async () => {
    if (!reviewFor) return
    setReviewSubmitting(true)
    setReviewError('')
    try {
      await createReview(reviewFor.id, reviewRating, reviewComment, reviewPhoto || undefined)
      setBookings((bs) => bs.map((b) => (b.id === reviewFor.id ? { ...b, reviewed: true } : b)))
      setReviewFor(null)
      setReviewComment('')
      setReviewRating(0)
      setReviewPhoto('')
      setPaymentMsg({ type: 'success', text: 'Thanks! Your review has been published.' })
    } catch (err) {
      setReviewError(getApiErrorMessage(err, 'Could not submit your review. Please try again.'))
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

        {loadError && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-2 text-sm font-medium text-red-800 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <span className="flex items-center gap-2"><AlertCircle size={16} className="shrink-0" aria-hidden="true" />{loadError}</span>
            <button onClick={loadBookings} className="shrink-0 px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="group" aria-label="Filter bookings">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              aria-pressed={activeTab === t}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === t ? 'text-white bg-[#047857]' : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200'}`}
            >
              {t}
              <span className={`text-xs rounded-full px-1.5 ${activeTab === t ? 'bg-white text-[#065f46]' : 'bg-gray-100 text-gray-700'}`}>{tabCounts[t]}</span>
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No {activeTab.toLowerCase() === 'all' ? '' : activeTab.toLowerCase() + ' '}bookings here yet</p>
            <Link href="/search" className="mt-3 inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857]">
              Find an Artisan
            </Link>
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
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {b.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                        </span>
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
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Link
                        href={`/artisans/${b.artisanId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare size={13} />View Profile
                      </Link>
                      {b.status === 'Completed' && !b.reviewed && (
                        <button
                          onClick={() => { setReviewFor(b); setReviewRating(0); setReviewComment(''); setReviewError('') }}
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
                      {b.status === 'Confirmed' || b.status === 'Completed' ? (
                        <button
                          onClick={() => { setDisputeFor(b); setDisputeReason(''); setDisputeError('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Flag size={13} />Raise Dispute
                        </button>
                      ) : null}
                      {b.paymentStatus === 'UNPAID' && b.status === 'Pending' && (
                        <button
                          onClick={() => handlePay(b)}
                          disabled={payingId === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <CreditCard size={13} />{payingId === b.id ? 'Redirecting…' : 'Pay Now'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setCancelConfirm(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title" className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 id="cancel-dialog-title" className="font-display text-lg font-bold text-gray-900">Cancel this booking?</h2>
              <button onClick={() => setCancelConfirm(null)} aria-label="Close dialog" className="p-2 -m-1 text-gray-500 hover:text-gray-700">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your booking with <span className="font-semibold text-gray-900">{cancelConfirm.artisan}</span> on{' '}
              {cancelConfirm.date} at {cancelConfirm.time} will be cancelled. This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancellingId === cancelConfirm.id}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancellingId === cancelConfirm.id ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {disputeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDisputeFor(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="dispute-dialog-title" className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 id="dispute-dialog-title" className="font-display text-lg font-bold text-gray-900">Raise a dispute</h2>
              <button onClick={() => setDisputeFor(null)} aria-label="Close dialog" className="p-2 -m-1 text-gray-500 hover:text-gray-700">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Tell us what went wrong with your booking with{' '}
              <span className="font-semibold text-gray-900">{disputeFor.artisan}</span>. Our team will review it.
            </p>
            <div className="flex items-start gap-2 bg-emerald-50 rounded-xl px-3 py-2.5 mb-4">
              <ShieldCheck size={15} className="text-[#047857] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Paid bookings are covered by the <span className="font-semibold text-[#047857]">NaijaHandy Guarantee</span> —
                claims must be raised within 14 days of the job date.{' '}
                <Link href="/guarantee" className="font-medium text-[#047857] hover:underline">Read the guarantee</Link>
              </p>
            </div>
            <label htmlFor="dispute-reason" className="sr-only">Describe the issue</label>
            <textarea
              id="dispute-reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              minLength={10}
              placeholder="Describe the issue (min 10 characters)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#047857] transition-colors resize-none mb-4"
            />
            {disputeError && <p className="text-xs text-red-600 mb-3" role="alert">{disputeError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setDisputeFor(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDispute}
                disabled={disputeSubmitting || disputeReason.trim().length < 10}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {disputeSubmitting ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Review modal */}
      {reviewFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setReviewFor(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 id="review-dialog-title" className="font-display text-lg font-bold text-gray-900">Review your booking</h2>
              <button onClick={() => setReviewFor(null)} aria-label="Close dialog" className="p-2 -m-1 text-gray-500 hover:text-gray-700">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              How was your experience with{' '}
              <span className="font-semibold text-gray-900">{reviewFor.artisan}</span>?
            </p>

            <div className="flex items-center gap-1 mb-4" role="group" aria-label="Rate your experience">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-2 -m-1"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  aria-pressed={star <= reviewRating}
                >
                  <Star
                    size={26}
                    className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    aria-hidden="true"
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">{reviewRating ? `${reviewRating}/5` : 'Tap to rate'}</span>
            </div>

            <label htmlFor="review-comment" className="sr-only">Share your experience</label>
            <textarea
              id="review-comment"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              placeholder="Share your experience (min 3 characters)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#047857] transition-colors resize-none mb-3"
            />

            {reviewPhoto && (
              <div className="relative inline-block mb-3">
                <Image src={reviewPhoto} alt="Review photo preview" width={200} height={150} className="h-28 w-40 object-cover rounded-xl border border-gray-100" />
                <button
                  type="button"
                  onClick={() => { setReviewPhoto(''); if (reviewPhotoInputRef.current) reviewPhotoInputRef.current.value = '' }}
                  aria-label="Remove review photo"
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-gray-900 text-white hover:bg-red-600 transition-colors"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="mb-3">
              <input
                ref={reviewPhotoInputRef}
                id="review-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setReviewError('')
                  try {
                    setReviewPhoto(await readPhotoAsDataUrl(file))
                  } catch {
                    setReviewError('Could not read the selected photo. Please try again.')
                  }
                }}
              />
              <label htmlFor="review-photo" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                <Camera size={14} aria-hidden="true" />
                {reviewPhoto ? 'Change photo (optional)' : 'Add a photo (optional)'}
              </label>
            </div>
            {reviewError && <p className="text-xs text-red-600 mb-3" role="alert">{reviewError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setReviewFor(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewSubmitting || reviewRating === 0 || reviewComment.trim().length < 3}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  )
}
