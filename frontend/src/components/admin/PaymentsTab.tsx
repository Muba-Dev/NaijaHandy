import { formatNGN } from '@/lib/utils'
import type { AdminPayment } from '@/types'
import { Pill, fmtDate } from './shared'

export default function PaymentsTab({ payments }: { payments: AdminPayment[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
      {payments.length === 0 && <p className="p-6 text-sm text-gray-500">No payments recorded yet.</p>}
      {payments.map((p) => (
        <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm">{formatNGN(p.amount)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {p.status} · {p.method || 'n/a'} · ref {p.reference || '—'} · {fmtDate(p.createdAt)}
              {p.booking ? ` · for booking ${p.booking.id.slice(-6).toUpperCase()}` : ''}
            </p>
          </div>
          <Pill label={p.status} tone={p.status === 'SUCCESS' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'} />
        </div>
      ))}
    </div>
  )
}