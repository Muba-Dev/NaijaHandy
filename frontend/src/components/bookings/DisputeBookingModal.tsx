import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { Booking } from '@/types'

interface Props {
  booking: Booking
  submitting: boolean
  onSubmit: (reason: string) => void
  onClose: () => void
}

export default function DisputeBookingModal({ booking, submitting, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setReason('')
    setError('')
  }, [booking.id])

  return (
    <Modal title="Raise a dispute" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        Tell us what went wrong with your booking with{' '}
        <span className="font-semibold text-gray-900">{booking.artisan}</span>. Our team will review it.
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
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        minLength={10}
        placeholder="Describe the issue (min 10 characters)..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#047857] transition-colors resize-none mb-4"
      />
      {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(reason)}
          disabled={submitting || reason.trim().length < 10}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Dispute'}
        </button>
      </div>
    </Modal>
  )
}