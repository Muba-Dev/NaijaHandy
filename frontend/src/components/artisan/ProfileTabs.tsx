import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Briefcase, BadgeCheck, Star, ShieldCheck, Clock, Home, Check, CheckCircle, Wrench } from 'lucide-react'
import LocationMap from '@/components/map/LocationMap'
import SkillBadges from '@/components/SkillBadges'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import type { Artisan } from '@/types'

const TABS = ['about', 'services', 'portfolio', 'reviews'] as const
type Tab = (typeof TABS)[number]

export default function ProfileTabs({ artisan }: { artisan: Artisan }) {
  const [activeTab, setActiveTab] = useState<Tab>('about')

  const ratingDistribution = (() => {
    const counts = [0, 0, 0, 0, 0]
    for (const r of artisan.reviews_list) {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1))
      counts[idx] += 1
    }
    const total = counts.reduce((s, c) => s + c, 0)
    return total ? counts.map((c) => Math.round((c / total) * 100)) : counts
  })()

  return (
    <>
      {artisan.latitude != null && artisan.longitude != null && (
        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900">
              <MapPin size={16} className="text-[#047857]" aria-hidden="true" /> Location
            </h2>
            <a
              href={`https://www.google.com/maps?q=${artisan.latitude},${artisan.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#047857] hover:underline"
            >
              Open in Google Maps
            </a>
          </div>
          {artisan.address && <p className="mb-4 text-sm text-gray-600">{artisan.address}</p>}
          <LocationMap lat={artisan.latitude} lng={artisan.longitude} />
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-6 pb-0 pt-6">
          <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-gray-100 p-1" aria-label="Artisan details">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${activeTab === t ? 'bg-white text-[#047857] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {t === 'about' ? 'About' : t === 'services' ? 'Services & Pricing' : t === 'portfolio' ? 'Portfolio' : 'Reviews'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'about' && <AboutSection artisan={artisan} />}
          {activeTab === 'services' && <ServicesSection artisan={artisan} />}
          {activeTab === 'portfolio' && <PortfolioSection artisan={artisan} />}
          {activeTab === 'reviews' && <ReviewsSection artisan={artisan} ratingDistribution={ratingDistribution} />}
        </div>
      </div>
    </>
  )
}

function AboutSection({ artisan }: { artisan: Artisan }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-gray-900">About {artisan.name}</h2>
      <p className="mt-3 text-base leading-relaxed text-gray-600">{artisan.bio}</p>

      {artisan.services.length > 0 && (
        <div className="mt-7">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Specialties</h3>
          <SkillBadges services={artisan.services} />
        </div>
      )}

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Briefcase, label: 'Hourly Rate', value: formatNGN(artisan.hourlyRate) },
          { icon: BadgeCheck, label: 'Jobs Completed', value: String(artisan.completedJobsCount) },
          { icon: Star, label: 'Avg. Rating', value: `${artisan.rating} / 5` },
          { icon: ShieldCheck, label: 'Verification', value: artisan.verified ? 'Verified' : 'Pending' },
          { icon: Clock, label: 'Availability', value: artisan.available ? 'Available now' : 'Currently busy' },
          { icon: Home, label: 'Service Area', value: artisan.city || 'Nigeria' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#047857] shadow-sm">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="truncate text-sm font-semibold text-gray-900">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {artisan.recentCompletedJobs.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Work History</h3>
          <div className="space-y-3">
            {artisan.recentCompletedJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#047857]">
                    <Check size={15} aria-hidden="true" />
                  </span>
                  <span className="truncate text-sm font-medium text-gray-800">{j.description}</span>
                </div>
                <span className="ml-3 shrink-0 text-xs text-gray-500">{j.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ServicesSection({ artisan }: { artisan: Artisan }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-gray-900">Services &amp; Pricing</h2>
      {artisan.services.length > 0 ? (
        <div className="mt-4 space-y-3">
          {artisan.services.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                  <Wrench size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">Book this service</p>
                </div>
              </div>
              <span className="font-display text-lg font-bold text-gray-900">{formatNGN(s.rate)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No services listed yet.</p>
      )}
    </div>
  )
}

function PortfolioSection({ artisan }: { artisan: Artisan }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-gray-900">Portfolio</h2>
      {artisan.portfolio.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {artisan.portfolio.map((item, i) => (
            <Image
              key={item.id || i}
              src={item.imageUrl}
              alt={item.caption || `${artisan.name} portfolio photo ${i + 1}`}
              width={400}
              height={300}
              className="h-40 w-full cursor-pointer rounded-2xl object-cover transition-transform hover:scale-[1.03]"
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No portfolio items yet.</p>
      )}
    </div>
  )
}

function ReviewsSection({ artisan, ratingDistribution }: { artisan: Artisan; ratingDistribution: number[] }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-gray-900">Reviews</h2>
      <div className="mt-5 flex flex-col gap-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-6 sm:flex-row sm:items-center">
        <div className="text-center sm:w-40">
          <p className="font-display text-5xl font-bold text-gray-900">{artisan.rating}</p>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" aria-hidden="true" />)}
          </div>
          <p className="mt-1 text-xs text-gray-500">{artisan.reviews} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span className="w-2 text-xs text-gray-500">{n}</span>
              <Star size={10} className="shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${ratingDistribution[5 - n]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {artisan.reviews_list.map((r, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start gap-3">
              <Image src={r.avatar || DEFAULT_AVATAR} alt={r.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    {r.name}
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#047857]">
                      <CheckCircle size={10} aria-hidden="true" />Verified buyer
                    </span>
                  </p>
                  <span className="text-xs text-gray-500">{r.date}</span>
                </div>
                <div className="my-1 flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" aria-hidden="true" />)}
                </div>
                <p className="text-sm text-gray-600">{r.comment}</p>
                {r.photoUrl && (
                  <Image src={r.photoUrl} alt={`Work photo from ${r.name}`} width={320} height={240} className="mt-2 h-36 w-56 rounded-xl border border-gray-100 object-cover" />
                )}
              </div>
            </div>
          </div>
        ))}
        {artisan.reviews_list.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  )
}