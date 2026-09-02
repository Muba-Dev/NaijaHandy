import Link from 'next/link'
import { RefreshCw, Zap, ShieldCheck, MessageSquare } from 'lucide-react'
import StarRating from '@/components/StarRating'
import { formatNGN, buildWhatsAppLink, estimateBookingAmount, minServiceRate } from '@/lib/utils'
import type { Artisan } from '@/types'

interface Props {
  artisan: Artisan
  selectedService: string
  onServiceChange: (v: string) => void
  hours: number
  onHoursChange: (v: number) => void
  bookingDate: string
  onDateChange: (v: string) => void
  bookingTime: string
  onTimeChange: (v: string) => void
  isUrgent: boolean
  onUrgentChange: (v: boolean) => void
  contactPhone: string
  onPhoneChange: (v: string) => void
  jobAddress: string
  onAddressChange: (v: string) => void
  jobDesc: string
  onDescChange: (v: string) => void
  rebookActive: boolean
  bookingSubmitting: boolean
  bookingSuccess: boolean
  bookingError: string
  instantSent: boolean
  onInstantRequest: () => void
  onBook: () => void
}

export default function BookingCard(props: Props) {
  const {
    artisan, selectedService, onServiceChange, hours, onHoursChange,
    bookingDate, onDateChange, bookingTime, onTimeChange,
    isUrgent, onUrgentChange, contactPhone, onPhoneChange, jobAddress, onAddressChange,
    jobDesc, onDescChange, rebookActive, bookingSubmitting, bookingSuccess, bookingError,
    instantSent, onInstantRequest, onBook,
  } = props

  const estimate = estimateBookingAmount(artisan.services, selectedService, hours, artisan.hourlyRate)
  const whatsappLink = buildWhatsAppLink(artisan.phone, `Hello ${artisan.name}! I found you on NaijaHandy and I have a question about your ${artisan.profession} service before I book.`)

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-emerald-100'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="sticky top-20 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-900/5">
      {rebookActive && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <RefreshCw size={13} aria-hidden="true" /> Rebooking {artisan.name}
          </p>
          <p className="mt-1 text-xs text-emerald-700">Your previous job details are pre-filled — pick a date and book again.</p>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Starting price</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        {minServiceRate(artisan.services) != null ? (
          <p className="font-display text-3xl font-bold text-gray-900">
            {formatNGN(minServiceRate(artisan.services)!)}
          </p>
        ) : (
          <p className="font-display text-3xl font-bold text-gray-900">
            {formatNGN(artisan.hourlyRate)}
            <span className="text-base font-medium text-gray-500">/hr</span>
          </p>
        )}
        <StarRating value={artisan.rating} count={artisan.reviews} />
      </div>
      <p className="mt-1 text-xs text-gray-500">Prices vary by job details and duration</p>

      <div className="mt-5 space-y-3">
            <button
              onClick={onInstantRequest}
              disabled={bookingSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-gray-900 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-300 hover:to-orange-400 disabled:opacity-50"
            >
              <Zap size={15} aria-hidden="true" />{bookingSubmitting ? 'Sending…' : 'Send Instant Request'}
            </button>
            <p className="-mt-1 text-center text-xs text-gray-500">One tap — we&apos;ll use today, ASAP and your saved contact details</p>

            {instantSent && (
              <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                <p className="text-sm font-semibold text-emerald-800">Instant request sent!</p>
                <p className="mt-1 text-xs text-emerald-700">{artisan.name} will confirm your date and time shortly.</p>
              </div>
            )}

            <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />or customize below<span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
            </div>

            <div>
              <label htmlFor="booking-date" className={labelCls}>Date</label>
              <input
                id="booking-date"
                type="date"
                value={bookingDate}
                onChange={(e) => onDateChange(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="booking-time" className={labelCls}>Time</label>
              <select
                id="booking-time"
                value={bookingTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className={inputCls}
              >
                <option value="">Select time slot</option>
                <option value="ASAP">ASAP — any time</option>
                {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => onUrgentChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-red-600"
              />
              <span>
                <span className="block text-sm font-semibold text-red-800">Urgent — I need this today</span>
                <span className="mt-0.5 block text-xs text-red-700">The artisan gets an urgent-priority request. Available-now artisans show up first in search.</span>
              </span>
            </label>

            {artisan.services.length > 0 && (
              <div>
                <label htmlFor="booking-service" className={labelCls}>Service</label>
                <select
                  id="booking-service"
                  value={selectedService}
                  onChange={(e) => onServiceChange(e.target.value)}
                  className={inputCls}
                >
                  {artisan.services.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} — {formatNGN(s.rate)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="booking-duration" className={labelCls}>Duration</label>
              <select
                id="booking-duration"
                value={hours}
                onChange={(e) => onHoursChange(Number(e.target.value))}
                className={inputCls}
              >
                {[1, 2, 4, 8].map((h) => (
                  <option key={h} value={h}>{h} {h > 1 ? 'hours' : 'hour'}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="booking-phone" className={labelCls}>Phone <span className="font-normal text-gray-500">(so the artisan can reach you)</span></label>
              <input
                id="booking-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="e.g. 08012345678"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="booking-address" className={labelCls}>Job Address <span className="font-normal text-gray-500">(where the work is)</span></label>
              <input
                id="booking-address"
                type="text"
                value={jobAddress}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="e.g. 12 Admiralty Way, Lekki, Lagos"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="job-desc" className={labelCls}>Job Description</label>
              <textarea
                id="job-desc"
                value={jobDesc}
                onChange={(e) => onDescChange(e.target.value)}
                placeholder="Describe the job in detail..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
      </div>

      {/* Estimate */}
      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{selectedService ? `${selectedService} (${hours}hr${hours > 1 ? 's' : ''})` : `Service fee (est. ${hours}hrs)`}</span>
          <span className="text-gray-700">{formatNGN(estimate.serviceFee)}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-sm">
          <span className="text-gray-500">Platform fee</span>
          <span className="text-gray-700">{formatNGN(estimate.platformFee)}</span>
        </div>
        <div className="mt-2.5 flex justify-between border-t border-gray-200 pt-2.5">
          <span className="text-sm font-bold text-gray-900">Estimated Total</span>
          <span className="font-display text-base font-bold text-[#047857]">{formatNGN(estimate.total)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-xs font-bold text-[#047857]">
          <ShieldCheck size={14} aria-hidden="true" /> NaijaHandy Guarantee
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Paid bookings are protected — if the job isn&apos;t done right, we&apos;ll make it right.
        </p>
        <Link href="/guarantee" className="mt-1.5 inline-block text-xs font-medium text-[#047857] hover:underline">
          Read the guarantee
        </Link>
      </div>

      <button
        onClick={onBook}
        disabled={bookingSubmitting || !bookingDate || !bookingTime || !jobDesc}
        className="mt-4 block w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50"
      >
        {bookingSubmitting ? 'Booking…' : bookingSuccess ? 'Booking Created — Pay Later ✓' : 'Proceed to Book & Pay'}
      </button>
      {bookingError && <p className="mt-2 text-center text-xs text-red-600" role="alert">{bookingError}</p>}
      <p className="mt-2.5 text-center text-xs text-gray-500">Instant requests are free — you&apos;ll only pay when completing checkout</p>
      <Link href="/help" className="mt-2 block text-center text-xs font-medium text-[#047857] hover:underline">
        Need help? Visit our Help Centre
      </Link>

      {whatsappLink && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
          <p className="text-xs text-gray-500">Questions before you book?</p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#075E54] hover:underline"
          >
            <MessageSquare size={14} aria-hidden="true" /> Chat with {artisan.name} on WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}