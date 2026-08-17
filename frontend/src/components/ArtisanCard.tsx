import Link from 'next/link'
import Image from 'next/image'
import { MapPin, BadgeCheck } from 'lucide-react'
import type { Artisan } from '@/types'
import { formatNGN, minServiceRate } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StarRating from './StarRating'
import SkillBadges from './SkillBadges'

interface Props {
  artisan: Artisan
}

export default function ArtisanCard({ artisan }: Props) {
  const rate = minServiceRate(artisan.services)

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10">
      <div aria-hidden className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Image
              src={artisan.avatar || DEFAULT_AVATAR}
              alt={artisan.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl object-cover ring-4 ring-emerald-50"
            />
            <span
              aria-hidden="true"
              className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${artisan.available ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-gray-900">{artisan.name}</h3>
              {artisan.verified && <BadgeCheck size={16} className="shrink-0 text-[#047857]" aria-label="Verified artisan" />}
            </div>
            <p className="text-sm text-gray-500">{artisan.profession}</p>
            <div className="mt-1 flex items-center gap-1">
              <MapPin size={12} className="text-gray-400" aria-hidden="true" />
              <span className="text-xs text-gray-500">{artisan.city}</span>
            </div>
          </div>
          {artisan.available && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Available
            </span>
          )}
          <span className="sr-only">{artisan.available ? 'Available now' : 'Currently busy'}</span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-500 line-clamp-2">{artisan.bio}</p>

        <div className="mt-4">
          <SkillBadges services={artisan.services} limit={3} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <StarRating value={artisan.rating} count={artisan.reviews} />
          {rate != null ? (
            <div className="text-right">
              <p className="text-[11px] text-gray-600">Starts from</p>
              <p className="text-sm font-bold text-gray-900">{formatNGN(rate)}</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[11px] text-gray-600">Rate</p>
              <p className="text-sm font-bold text-gray-900">{formatNGN(artisan.hourlyRate)}/hr</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-50 bg-gray-50/70 px-6 py-4">
        <Link
          href={`/artisans/${artisan.id}`}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-[#047857] hover:text-[#047857]"
        >
          View Profile
        </Link>
        <Link
          href={`/artisans/${artisan.id}`}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-600"
        >
          Book Now
        </Link>
      </div>
    </div>
  )
}
