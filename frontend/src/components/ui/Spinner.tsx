import { cn } from '@/lib/utils'

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-10 h-10 border-[3px]',
} as const

export default function Spinner({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <div
      className={cn(sizes[size], 'border-[#047857] border-t-transparent rounded-full animate-spin', className)}
      aria-hidden="true"
    />
  )
}