import { ShieldCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { formatNGN } from '@/lib/utils'
import type { Booking, CreditWallet } from '@/types'

interface Props {
  booking: Booking
  wallet: CreditWallet | null
  applyCredits: boolean
  onApplyCreditsChange: (v: boolean) => void
  paying: boolean
  onPay: () => void
  onClose: () => void
}

export default function PayBookingModal({ booking, wallet, applyCredits, onApplyCreditsChange, paying, onPay, onClose }: Props) {
  const credits = Math.min(wallet?.balance ?? 0, booking.amount)
  const applied = applyCredits ? credits : 0
  const charge = booking.amount - applied

  return (
    <Modal title="Pay for your booking" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-5">
        Booking with <span className="font-semibold text-gray-900">{booking.artisan}</span> on {booking.date} at {booking.time}.
      </p>

      <dl className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-600">Job total</dt>
          <dd className="font-medium text-gray-900">{formatNGN(booking.amount)}</dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-600">Rewards credits</dt>
          <dd className="font-medium text-[#047857]">− {formatNGN(applied)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm font-semibold">
          <dt className="text-gray-900">You&apos;ll pay</dt>
          <dd className="text-gray-900">{formatNGN(charge)}</dd>
        </div>
      </dl>

      {wallet && wallet.balance > 0 && (
        <label className="flex items-center gap-2.5 mb-5 bg-emerald-50 rounded-xl px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={applyCredits}
            onChange={(e) => onApplyCreditsChange(e.target.checked)}
            className="w-5 h-5 accent-[#047857]"
          />
          <span className="text-sm text-gray-700">
            Apply <span className="font-semibold">{formatNGN(credits)}</span> in rewards credits
          </span>
        </label>
      )}
      {wallet && wallet.balance === 0 && (
        <p className="text-xs text-gray-500 mb-5">
          No rewards credits yet — earn 5% back when your booking is completed.
        </p>
      )}

      <div className="flex items-start gap-2 bg-emerald-50 rounded-xl px-3 py-2.5 mb-5">
        <ShieldCheck size={15} className="text-[#047857] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-gray-600 leading-relaxed">
          Your payment is held in escrow and only released to the artisan once the job is completed.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onPay}
          disabled={paying}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {paying ? 'Redirecting…' : 'Continue to Payment'}
        </button>
      </div>
    </Modal>
  )
}