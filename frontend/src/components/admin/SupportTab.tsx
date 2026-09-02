import FilterTabs from '@/components/ui/FilterTabs'
import type { SupportMessage } from '@/types'
import { Pill, fmtDate } from './shared'

interface Props {
  messages: SupportMessage[]
  filter: string
  onFilterChange: (f: string) => void
  busyId: string | null
  onStatus: (id: string, status: SupportMessage['status']) => void
}

export default function SupportTab({ messages, filter, onFilterChange, busyId, onStatus }: Props) {
  return (
    <div>
      <FilterTabs
        items={['ALL', 'OPEN', 'REPLIED', 'CLOSED']}
        active={filter}
        onChange={onFilterChange}
        className="mb-4 flex-wrap"
        baseClassName="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        activeClassName="bg-[#047857] text-white"
        inactiveClassName="bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
        renderLabel={(f: string) => (f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase())}
      />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {messages.length === 0 && <p className="p-6 text-sm text-gray-500">No support messages found.</p>}
        {messages.map((m) => (
          <div key={m.id} className="p-5">
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{m.subject}</p>
                  <Pill label={m.status} tone={m.status === 'OPEN' ? 'red' : m.status === 'REPLIED' ? 'amber' : 'gray'} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ''}{m.user ? ` · account ${m.user.id.slice(0, 8)}` : ' · guest'} · {fmtDate(m.createdAt)}
                </p>
                <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap">“{m.message}”</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={busyId === m.id}
                  onClick={() => onStatus(m.id, m.status === 'OPEN' ? 'REPLIED' : m.status === 'REPLIED' ? 'OPEN' : 'REPLIED')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                >
                  {m.status === 'OPEN' ? 'Mark replied' : m.status === 'REPLIED' ? 'Reopen' : 'Reopen'}
                </button>
                <button
                  disabled={busyId === m.id}
                  onClick={() => onStatus(m.id, m.status === 'CLOSED' ? 'OPEN' : 'CLOSED')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  {m.status === 'CLOSED' ? 'Reopen' : 'Close'}
                </button>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                  Reply
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}