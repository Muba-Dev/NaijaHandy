import { cn } from '@/lib/utils'

export default function SkeletonCard({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return <div className={cn('bg-white rounded-2xl border border-gray-100 animate-pulse', className)}>{children}</div>
}