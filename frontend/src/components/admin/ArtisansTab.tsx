import Image from 'next/image'
import { Check, X, RefreshCcw, FileText } from 'lucide-react'
import FilterTabs from '@/components/ui/FilterTabs'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import type { AdminArtisan } from '@/types'
import { Pill, approvalTone, verificationTone, fmtDate } from './shared'

interface Props {
  artisans: AdminArtisan[]
  filter: string
  onFilterChange: (f: string) => void
  busyId: string | null
  onApprove: (id: string, status: string) => void
  onVerify: (id: string, status: string) => void
}

export default function ArtisansTab({ artisans, filter, onFilterChange, busyId, onApprove, onVerify }: Props) {
  return (
    <div>
      <FilterTabs
        items={['ALL', 'PENDING', 'APPROVED', 'REJECTED']}
        active={filter}
        onChange={onFilterChange}
        className="mb-4 flex-wrap"
        baseClassName="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        activeClassName="bg-[#047857] text-white"
        inactiveClassName="bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
        renderLabel={(f: string) => (f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase())}
      />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {artisans.length === 0 && <p className="p-6 text-sm text-gray-500">No artisans match this filter.</p>}
        {artisans.map((a) => (
          <div key={a.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
            <Image
              src={a.user.avatar || DEFAULT_AVATAR}
              alt={a.user.name}
              width={48}
              height={48}
              className="rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 text-sm">{a.user.name}</p>
                <Pill label={a.approvalStatus} tone={approvalTone(a.approvalStatus)} />
                <Pill label={a.verificationStatus} tone={verificationTone(a.verificationStatus)} />
                <Pill label={a.user.status} tone={a.user.status === 'SUSPENDED' ? 'red' : 'green'} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {a.profession} · {a.user.city || 'No city'} · {formatNGN(a.hourlyRate ?? 0)}/hr · ⭐ {(a.avgRating ?? 0).toFixed(1)} ({a.totalReviews}) · joined {fmtDate(a.createdAt)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{a.user.email}</p>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {a.approvalStatus !== 'APPROVED' ? (
                <button disabled={busyId === a.id} onClick={() => onApprove(a.id, 'APPROVED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#047857] hover:opacity-90 disabled:opacity-50">
                  <Check size={13} /> Approve
                </button>
              ) : (
                <button disabled={busyId === a.id} onClick={() => onApprove(a.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                  <X size={13} /> Reject
                </button>
              )}
              {a.verificationDocUrl && (
                <a
                  href={a.verificationDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FileText size={13} /> View ID
                </a>
              )}
              {a.verificationStatus === 'PENDING' ? (
                <>
                  <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'VERIFIED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50">
                    <Check size={13} /> Verify
                  </button>
                  <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                    <X size={13} /> Reject
                  </button>
                </>
              ) : a.verificationStatus !== 'VERIFIED' ? (
                <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'VERIFIED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50">
                  <Check size={13} /> Verify
                </button>
              ) : (
                <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'UNVERIFIED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                  <RefreshCcw size={13} /> Unverify
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}