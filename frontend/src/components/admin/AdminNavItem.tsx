import type { LucideIcon } from 'lucide-react'

export default function AdminNavItem({
  icon: Icon,
  label,
  active,
  badge,
  badgeTone,
  onClick,
  variant = 'desktop',
}: {
  icon: LucideIcon
  label: string
  active: boolean
  badge?: number
  badgeTone?: 'amber' | 'red'
  onClick: () => void
  variant?: 'desktop' | 'mobile'
}) {
  const badgeClasses =
    variant === 'mobile'
      ? `ml-0.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${badgeTone === 'amber' ? 'bg-amber-400' : 'bg-red-600'}`
      : `ml-auto w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${badgeTone === 'amber' ? 'bg-amber-400' : 'bg-red-600'}`

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={
        variant === 'mobile'
          ? `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${active ? 'text-[#047857] bg-[#047857]/10' : 'text-gray-600 hover:bg-gray-50'}`
          : `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`
      }
    >
      <Icon size={variant === 'mobile' ? 13 : 16} aria-hidden="true" />
      {label}
      {badge != null && badge > 0 && <span className={badgeClasses}>{badge}</span>}
    </button>
  )
}
