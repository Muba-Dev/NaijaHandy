import { Star } from 'lucide-react'

interface Props {
  value: number
  count?: number
}

export default function StarRating({ value, count }: Props) {
  return (
    <span
      className="flex items-center gap-1"
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5 stars${count !== undefined ? ` from ${count} review${count === 1 ? '' : 's'}` : ''}`}
    >
      <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-semibold text-sm text-gray-900" aria-hidden="true">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-gray-500 text-sm" aria-hidden="true">({count})</span>
      )}
    </span>
  )
}
