import FilterTabs from '@/components/ui/FilterTabs'
import StatusBadge from '@/components/StatusBadge'
import { formatNGN } from '@/lib/utils'
import type { AdminBooking } from '@/types'
import { Pill, fmtDate } from './shared'

interface Props {
  bookings: AdminBooking[]
  filter: string
  onFilterChange: (f: string) => void
}

export default function BookingsTab({ bookings, filter, onFilterChange }: Props) {
  return (
    <div>
      <FilterTabs
        items={['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED']}
        active={filter}
        onChange={onFilterChange}
        className="mb-4 flex-wrap"
        baseClassName="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        activeClassName="bg-[#047857] text-white"
        inactiveClassName="bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
        renderLabel={(f: string) => (f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase())}
      />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {bookings.length === 0 && <p className="p-6 text-sm text-gray-500">No bookings found.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 text-sm">{b.customer.name} → {b.artisan.user.name}</p>
                <StatusBadge status={(b.status.charAt(0) + b.status.slice(1).toLowerCase()) as 'Pending' | 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled'} />
                <Pill label={b.payment ? `PAID · ${b.payment.status}` : 'UNPAID'} tone={b.payment ? 'green' : 'amber'} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {b.artisan.profession} · {fmtDate(b.date)} at {b.time} · {formatNGN(b.amount)}
                {b.description ? ` · “${b.description}”` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}