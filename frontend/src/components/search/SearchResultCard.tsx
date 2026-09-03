import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, MapPin } from 'lucide-react'
import { DEFAULT_AVATAR } from '@/lib/data'
import { formatNGN, minServiceRate } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import SkillBadges from '@/components/SkillBadges'
import type { Artisan } from '@/types'

interface Props {
  artisan: Artisan
}

export default function SearchResultCard({ artisan }: Props) {
  const rate = minServiceRate(artisan.services)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row gap-4 hover:shadow-lg transition-shadow">
      <Image
        src={artisan.avatar || DEFAULT_AVATAR}
        alt={artisan.name}
        width={64}
        height={64}
        className="w-16 h-16 rounded-xl object-cover shrink-0 self-start"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900">{artisan.name}</h3>
              {artisan.verified && <CheckCircle size={15} className="text-[#047857]" />}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                {artisan.profession}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin size={11} aria-hidden="true" />{artisan.city}
              </span>
              {artisan.distanceKm != null && (
                <span className="text-xs text-gray-600">{artisan.distanceKm} km away</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {rate != null ? (
              <p className="font-bold text-gray-900">
                From <span className="text-xs font-semibold text-gray-500">{formatNGN(rate)}</span>
              </p>
            ) : (
              <p className="font-bold text-gray-900">
                {formatNGN(artisan.hourlyRate)}<span className="text-xs font-normal text-gray-600">/hr</span>
              </p>
            )}
            <div className={`text-xs mt-1 font-medium ${artisan.available ? 'text-emerald-700' : 'text-gray-600'}`}>
              {artisan.available ? '● Available now' : '○ Busy'}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{artisan.bio}</p>
        <SkillBadges services={artisan.services} limit={3} className="mt-2" />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <StarRating value={artisan.rating} count={artisan.reviews} />
          <div className="flex gap-2">
            <Link
              href={`/artisans/${artisan.id}`}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-[#047857] hover:text-[#047857] transition-colors"
            >
              View Profile
            </Link>
            <Link
              href={`/artisans/${artisan.id}?book=1`}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
