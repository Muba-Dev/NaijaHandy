import { formatNGN } from '@/lib/utils'
import type { AdminDispute } from '@/types'
import { Pill, fmtDate } from './shared'

interface Props {
  disputes: AdminDispute[]
  busyId: string | null
  resolving: string | null
  resolutionText: string
  onResolutionTextChange: (s: string) => void
  onBeginResolve: (id: string) => void
  onResolve: (id: string, status: string) => void
}

export default function DisputesTab({
  disputes, busyId, resolving, resolutionText, onResolutionTextChange, onBeginResolve, onResolve,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
      {disputes.length === 0 && <p className="p-6 text-sm text-gray-500">No disputes found.</p>}
      {disputes.map((d) => (
        <div key={d.id} className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 text-sm">{d.user.name} vs {d.booking.artisan.user.name}</p>
                <Pill label={d.status} tone={d.status === 'OPEN' ? 'red' : d.status === 'RESOLVED' ? 'green' : 'gray'} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {d.booking.artisan.profession} · booking {d.booking.id.slice(-6).toUpperCase()} · {fmtDate(d.booking.date)} · {formatNGN(d.booking.amount)} · filed {fmtDate(d.createdAt)}
              </p>
              <p className="text-sm text-gray-600 mt-1.5">“{d.reason}”</p>
              {d.resolution && <p className="text-sm text-gray-500 mt-1.5">Resolution: {d.resolution}</p>}
            </div>
          </div>
          {d.status === 'OPEN' && (
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              {resolving !== d.id ? (
                <button
                  onClick={() => onBeginResolve(d.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#047857] hover:opacity-90"
                >
                  Resolve
                </button>
              ) : (
                <>
                  <input
                    value={resolutionText}
                    onChange={(e) => onResolutionTextChange(e.target.value)}
                    placeholder="Resolution note…"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#047857]"
                  />
                  <button disabled={busyId === d.id || !resolutionText.trim()} onClick={() => onResolve(d.id, 'RESOLVED')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#047857] hover:opacity-90 disabled:opacity-50">
                    Resolve
                  </button>
                  <button disabled={busyId === d.id} onClick={() => onResolve(d.id, 'DISMISSED')} className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                    Dismiss
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}