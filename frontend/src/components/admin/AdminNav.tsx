import AdminNavItem from '@/components/admin/AdminNavItem'
import type { LucideIcon } from 'lucide-react'
import type { AdminStats } from '@/types'

type AdminTab<T extends string> = {
  id: T
  label: string
  icon: LucideIcon
}

export default function AdminNav<T extends string>({
  tab,
  stats,
  variant,
  tabs,
  onTabChange,
}: {
  tab: T
  stats: AdminStats | null
  variant: 'desktop' | 'mobile'
  tabs: readonly AdminTab<T>[]
  onTabChange: (id: T) => void
}) {
  return (
    <nav
      className={
        variant === 'mobile'
          ? 'flex gap-1 px-3 pt-2 pb-3 overflow-x-auto border-t border-gray-100'
          : 'flex-1 p-3 space-y-1'
      }
      aria-label="Admin console navigation"
    >
      {tabs.map((t) => {
        let badge: number | undefined
        let badgeTone: 'amber' | 'red' | undefined
        if (t.id === 'artisans' && stats && stats.pendingArtisans > 0) {
          badge = stats.pendingArtisans
          badgeTone = 'amber'
        } else if (t.id === 'disputes' && stats && stats.openDisputes > 0) {
          badge = stats.openDisputes
          badgeTone = 'red'
        } else if (t.id === 'support' && stats && stats.openSupportMessages > 0) {
          badge = stats.openSupportMessages
          badgeTone = 'red'
        }
        return (
          <AdminNavItem
            key={t.id}
            variant={variant}
            icon={t.icon}
            label={t.label}
            active={t.id === tab}
            badge={badge}
            badgeTone={badgeTone}
            onClick={() => onTabChange(t.id)}
          />
        )
      })}
    </nav>
  )
}
