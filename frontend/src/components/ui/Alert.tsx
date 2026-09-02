import { cn } from '@/lib/utils'

export default function Alert({
  variant = 'success',
  icon = false,
  className,
  children,
}: {
  variant?: 'success' | 'error' | 'warning'
  icon?: boolean
  className?: string
  children: React.ReactNode
}) {
  const styles =
    variant === 'error'
      ? 'bg-red-50 border border-red-200 text-red-700'
      : variant === 'warning'
        ? 'bg-amber-50 border border-amber-200 text-amber-700'
        : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('text-sm rounded-xl px-4 py-3', styles, icon && 'flex items-center gap-2', className)}>
      {children}
    </div>
  )
}