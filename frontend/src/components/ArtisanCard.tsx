import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CheckCircle } from 'lucide-react'
import type { Artisan } from '@/types'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StarRating from './StarRating'
import SkillBadges from './SkillBadges'

interface Props {
  artisan: Artisan
}

export default function ArtisanCard({ artisan }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Image
            src={artisan.avatar || DEFAULT_AVATAR}
            alt={artisan.name}
            width={56}
            height={56}
            className="rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 truncate">{artisan.name}</h3>
              {artisan.verified && (
                <CheckCircle size={15} className="shrink-0 text-[#047857]" />
              )}
              {artisan.isDemo && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title="Demo profile">
                  Demo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{artisan.profession}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-gray-400" aria-hidden="true" />
              <span className="text-xs text-gray-500">{artisan.city}</span>
            </div>
          </div>
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${artisan.available ? 'bg-emerald-500' : 'bg-gray-300'}`}
            title={artisan.available ? 'Available' : 'Busy'}
            aria-hidden="true"
          />
          <span className="sr-only">{artisan.available ? 'Available now' : 'Currently busy'}</span>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{artisan.bio}</p>
        <SkillBadges services={artisan.services} limit={3} className="mb-4" />
        <div className="flex items-center justify-between">
          <StarRating value={artisan.rating} count={artisan.reviews} />
          <span className="text-xs text-gray-500 font-medium">{formatNGN(artisan.hourlyRate)}/hr</span>
        </div>
      </div>
      <div className="px-5 pb-5 pt-0 flex gap-2">
        <Link
          href={`/artisans/${artisan.id}`}
          className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:border-[#047857] hover:text-[#047857] transition-colors text-center"
        >
          View Profile
        </Link>
        {artisan.isDemo ? (
          <span
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 text-center cursor-not-allowed"
            title="Demo profile — not bookable"
          >
            Demo profile
          </span>
        ) : (
          <Link
            href={`/artisans/${artisan.id}`}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#047857] hover:opacity-90 transition-opacity text-center"
          >
            Book Now
          </Link>
        )}
      </div>
    </div>
  )
}
