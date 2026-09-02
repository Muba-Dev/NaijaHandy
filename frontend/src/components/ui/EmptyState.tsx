import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div role="status" className={cn('text-center', compact ? 'py-12 px-5' : 'py-16', className)}>
      <Icon size={compact ? 36 : 40} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
      <p className="text-gray-600 font-medium">{title}</p>
      {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}