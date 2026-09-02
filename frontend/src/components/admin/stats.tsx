import { Users, ShieldCheck, Calendar, Scale, LifeBuoy, Star, CreditCard } from 'lucide-react'
import { formatNGN } from '@/lib/utils'
import type { AdminStats } from '@/types'

export default function StatsGrid({ stats }: { stats: AdminStats }) {
  const cards = [
    { label: 'Pending Approvals', value: stats.pendingArtisans, sub: 'artisans awaiting review', color: '#F59E0B', icon: ShieldCheck },
    { label: 'Total Artisans', value: stats.totalArtisans, sub: 'registered profiles', color: '#047857', icon: Users },
    { label: 'Registered Users', value: stats.totalUsers, sub: 'customers + artisans + admins', color: '#2563EB', icon: Users },
    { label: 'Bookings', value: stats.totalBookings, sub: 'all time', color: '#8B5CF6', icon: Calendar },
    { label: 'Open Disputes', value: stats.openDisputes, sub: 'need resolution', color: '#EF4444', icon: Scale },
    { label: 'Open Support', value: stats.openSupportMessages, sub: 'messages awaiting reply', color: '#8B5CF6', icon: LifeBuoy },
    { label: 'Hidden Reviews', value: stats.hiddenReviews, sub: 'moderated out', color: '#6B7280', icon: Star },
    { label: 'Escrow Held', value: formatNGN(stats.heldEscrow ?? 0), sub: `${stats.heldEscrowCount ?? 0} payments awaiting release`, color: '#D97706', icon: LifeBuoy },
    { label: 'Revenue', value: formatNGN(stats.revenue), sub: 'successful payments', color: '#047857', icon: CreditCard },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((s) => {
        const Icon = s.icon
        return (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
          </div>
        )
      })}
    </div>
  )
}