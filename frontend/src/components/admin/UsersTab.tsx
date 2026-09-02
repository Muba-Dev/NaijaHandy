import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import FilterTabs from '@/components/ui/FilterTabs'
import { DEFAULT_AVATAR } from '@/lib/data'
import type { AdminUser } from '@/types'
import { Pill, fmtDate } from './shared'

interface Props {
  users: AdminUser[]
  currentUserId?: string | null
  userSearch: string
  onUserSearch: (s: string) => void
  roleFilter: string
  onRoleFilterChange: (f: string) => void
  statusFilter: string
  onStatusFilterChange: (f: string) => void
  busyId: string | null
  onUserStatus: (id: string, status: string) => void
  onRequestDelete: (u: AdminUser) => void
}

export default function UsersTab({
  users, currentUserId, userSearch, onUserSearch,
  roleFilter, onRoleFilterChange, statusFilter, onStatusFilterChange,
  busyId, onUserStatus, onRequestDelete,
}: Props) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <input
          value={userSearch}
          onChange={(e) => onUserSearch(e.target.value)}
          aria-label="Search users by name or email"
          placeholder="Search by name or email…"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#047857]"
        />
        <FilterTabs
          items={['ALL', 'CUSTOMER', 'ARTISAN']}
          active={roleFilter}
          onChange={onRoleFilterChange}
          className="flex-wrap"
          baseClassName="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          activeClassName="bg-[#047857] text-white"
          inactiveClassName="bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          renderLabel={(f: string) => (f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase())}
        />
      </div>
      <FilterTabs
        items={['ALL', 'ACTIVE', 'SUSPENDED', 'DELETED']}
        active={statusFilter}
        onChange={onStatusFilterChange}
        className="mb-4 flex-wrap"
        baseClassName="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        activeClassName="bg-[#047857] text-white"
        inactiveClassName="bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
        renderLabel={(f: string) => (f === 'ALL' ? 'All statuses' : f.charAt(0) + f.slice(1).toLowerCase())}
      />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {users.length === 0 && <p className="p-6 text-sm text-gray-500">No users found.</p>}
        {users.map((u) => (
          <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
            <Image
              src={u.avatar || DEFAULT_AVATAR}
              alt={u.name}
              width={48}
              height={48}
              className="rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                <Pill label={u.role} tone={u.role === 'ADMIN' ? 'blue' : u.role === 'ARTISAN' ? 'green' : 'gray'} />
                <Pill label={u.status} tone={u.status === 'SUSPENDED' ? 'red' : u.status === 'DELETED' ? 'gray' : 'green'} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{u.email} · {u.city || 'No city'} · joined {fmtDate(u.createdAt)}</p>
            </div>
            {u.role !== 'ADMIN' && u.id !== currentUserId && u.status !== 'DELETED' && (
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={busyId === u.id}
                  onClick={() => onUserStatus(u.id, u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                >
                  {u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                </button>
                <button
                  disabled={busyId === u.id}
                  onClick={() => onRequestDelete(u)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}