import type { BookingStatus } from '@/types'

const STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}
