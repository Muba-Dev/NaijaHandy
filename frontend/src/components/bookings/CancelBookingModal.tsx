import { ShieldCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { Booking } from '@/types'

interface Props {
  booking: Booking
  cancelling: boolean
  onCancel: () => void
  onClose: () => void
}

export default function CancelBookingModal({ booking, cancelling, onCancel, onClose }: Props) {
  return (
    <Modal title="Cancel this booking?" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        Your booking with <span className="font-semibold text-gray-900">{booking.artisan}</span> on{' '}
        {booking.date} at {booking.time} will be cancelled. This can&apos;t be undone.
      </p>
      {booking.status === 'Confirmed' && (
        <p className="text-xs text-gray-500 mb-2">
          Confirmed bookings can only be cancelled within 24 hours of confirmation — if that window has
          passed, cancellation won&apos;t be allowed.
        </p>
      )}
      {booking.paymentStatus === 'PAID' && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-amber-700 mb-4">
          <ShieldCheck size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          Your payment is held in escrow — cancelling refunds it to you.
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Keep Booking
        </button>
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
        </button>
      </div>
    </Modal>
  )
}