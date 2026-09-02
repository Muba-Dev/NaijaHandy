import { cn } from '@/lib/utils'

export default function FilterTabs({
  items,
  active,
  onChange,
  ariaLabel,
  className,
  baseClassName = 'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
  activeClassName = 'text-white bg-[#047857]',
  inactiveClassName = 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200',
  renderLabel = (item) => item,
}: {
  items: readonly string[]
  active: string
  onChange: (item: string) => void
  ariaLabel?: string
  className?: string
  baseClassName?: string
  activeClassName?: string
  inactiveClassName?: string
  renderLabel?: (item: string, isActive: boolean) => React.ReactNode
}) {
  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-1', className)}
      {...(ariaLabel ? { role: 'group', 'aria-label': ariaLabel } : {})}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          aria-pressed={active === item}
          className={cn(baseClassName, active === item ? activeClassName : inactiveClassName)}
        >
          {renderLabel(item, active === item)}
        </button>
      ))}
    </div>
  )
}