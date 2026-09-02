import Image from 'next/image'
import FilterTabs from '@/components/ui/FilterTabs'
import type { AdminReview } from '@/types'
import { Pill, fmtDate } from './shared'

interface Props {
  reviews: AdminReview[]
  filter: string
  onFilterChange: (f: string) => void
  busyId: string | null
  onReviewStatus: (id: string, status: string) => void
}

export default function ReviewsTab({ reviews, filter, onFilterChange, busyId, onReviewStatus }: Props) {
  return (
    <div>
      <FilterTabs
        items={['ALL', 'APPROVED', 'HIDDEN']}
        active={filter}
        onChange={onFilterChange}
        className="mb-4 flex-wrap"
        baseClassName="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        activeClassName="bg-[#047857] text-white"
        inactiveClassName="bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
        renderLabel={(f: string) => (f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase())}
      />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {reviews.length === 0 && <p className="p-6 text-sm text-gray-500">No reviews found.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 text-sm">{r.customer.name}</p>
                <span className="text-xs text-amber-500 font-semibold">{"⭐".repeat(r.rating)}</span>
                <Pill label={r.status} tone={r.status === 'APPROVED' ? 'green' : 'gray'} />
              </div>
              <p className="text-xs text-gray-500 mt-1">on {r.artisan.profession} — {r.artisan.user.name} · {fmtDate(r.createdAt)}</p>
              <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>
              {r.photoUrl && (
                <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                  <Image src={r.photoUrl} alt="Review photo" width={160} height={120} className="h-20 w-32 object-cover rounded-lg border border-gray-100" />
                </a>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {r.status !== 'APPROVED' ? (
                <button disabled={busyId === r.id} onClick={() => onReviewStatus(r.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50">
                  Approve
                </button>
              ) : (
                <button disabled={busyId === r.id} onClick={() => onReviewStatus(r.id, 'HIDDEN')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                  Hide
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}