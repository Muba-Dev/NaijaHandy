interface Props {
  services: { name: string }[]
  limit?: number
  className?: string
}

export default function SkillBadges({ services, limit, className = '' }: Props) {
  if (!services || services.length === 0) return null
  const shown = limit ? services.slice(0, limit) : services
  const extra = limit ? Math.max(0, services.length - limit) : 0
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((s) => (
        <span
          key={s.name}
          className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857]"
        >
          {s.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          +{extra} more
        </span>
      )}
    </div>
  )
}
