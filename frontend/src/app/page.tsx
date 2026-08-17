'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Search, Briefcase, MapPin, ArrowRight, ArrowUpRight, Calendar, Shield,
  ShieldCheck, Star, Wrench, Zap, Hammer, PaintBucket, Car, Scissors, Home, Layers, Flame,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import { fetchArtisans, fetchCategoryCounts, fetchPlatformStats } from '@/lib/api'
import ArtisanCard from '@/components/ArtisanCard'
import type { Artisan, PlatformStats } from '@/types'

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const duration = 900
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{display.toLocaleString()}{suffix}</>
}

const CATEGORY_META: Record<string, { icon: LucideIcon; grad: string }> = {
  Plumbing: { icon: Wrench, grad: 'from-sky-500 to-blue-600' },
  Electrical: { icon: Zap, grad: 'from-amber-400 to-orange-500' },
  Carpentry: { icon: Hammer, grad: 'from-rose-500 to-pink-600' },
  Painting: { icon: PaintBucket, grad: 'from-violet-500 to-purple-600' },
  'Auto Repair': { icon: Car, grad: 'from-red-500 to-rose-600' },
  'Home Cleaning': { icon: Home, grad: 'from-cyan-500 to-teal-500' },
  Tailoring: { icon: Scissors, grad: 'from-fuchsia-500 to-pink-500' },
  'Tiling & Flooring': { icon: Layers, grad: 'from-emerald-500 to-green-600' },
}

const FALLBACK_META = { icon: Wrench, grad: 'from-emerald-500 to-teal-500' }

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Search,
    grad: 'from-sky-500 to-blue-600',
    title: 'Search',
    desc: 'Browse verified artisans by profession, location, or rating. Compare profiles, reviews and pricing side by side.',
  },
  {
    step: '02',
    icon: Calendar,
    grad: 'from-amber-400 to-orange-500',
    title: 'Book',
    desc: 'Pick a date and time that works for you. Describe the job and lock in a clear, upfront estimate.',
  },
  {
    step: '03',
    icon: Shield,
    grad: 'from-emerald-500 to-teal-600',
    title: 'Pay Safely',
    desc: 'Your payment is held securely and only released when the job is done to your satisfaction.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [searchProfession, setSearchProfession] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    fetchArtisans({ sortBy: 'rating', limit: '10' }).then(setArtisans).catch(() => setArtisans([]))
    fetchCategoryCounts().then(setCategoryCounts).catch(() => setCategoryCounts({}))
    fetchPlatformStats().then(setStats).catch(() => setStats(null))
  }, [])

  const searchHref = () => {
    const params = new URLSearchParams()
    if (searchProfession) params.set('q', searchProfession)
    if (searchCity.trim()) params.set('city', searchCity.trim())
    const qs = params.toString()
    return qs ? `/search?${qs}` : '/search'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(searchHref())
  }

  const statTiles = [
    { label: 'Verified Artisans', value: stats?.artisans ?? 0, icon: ShieldCheck, grad: 'from-emerald-400 to-teal-500', suffix: '' },
    { label: 'Cities Covered', value: stats?.cities ?? 0, icon: MapPin, grad: 'from-sky-400 to-blue-500', suffix: '' },
    { label: 'Jobs Completed', value: stats?.jobsCompleted ?? 0, icon: Briefcase, grad: 'from-amber-400 to-orange-500', suffix: '' },
    { label: 'Customer Reviews', value: stats?.reviews ?? 0, icon: Star, grad: 'from-violet-400 to-purple-500', suffix: '' },
  ]

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#022c22] via-[#03543f] to-[#064e3b]">
        {/* Decorative glows */}
        <div aria-hidden className="absolute -top-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div aria-hidden className="absolute left-1/3 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl" />

        <Image
          src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&h=600&fit=crop&auto=format"
          alt=""
          fill
          className="object-cover opacity-10"
          priority
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-16">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
            {/* Left: copy + search */}
            <div>
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-1.5 text-sm text-emerald-50 ring-1 ring-white/20 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                </span>
                {stats ? `Trusted by ${stats.artisans}+ verified artisans across Nigeria` : 'Trusted local artisans across Nigeria'}
              </div>

              <h1 className="font-display text-[2.6rem] leading-[1.05] font-bold text-white md:text-6xl lg:text-[4.1rem] mt-7">
                Find Trusted
                <br />Local Artisans
                <br />
                <span className="italic text-amber-400">Near You</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-emerald-100/90 md:text-lg">
                NaijaHandy connects you with verified, skilled artisans across Nigeria. Compare profiles, book in seconds,
                and pay only when you&apos;re happy with the work.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/25 ring-1 ring-black/5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-gray-50/80 px-4 py-3">
                  <Briefcase size={18} className="shrink-0 text-emerald-600" aria-hidden="true" />
                  <label htmlFor="home-profession" className="sr-only">Profession</label>
                  <select
                    id="home-profession"
                    value={searchProfession}
                    onChange={(e) => setSearchProfession(e.target.value)}
                    className="flex-1 cursor-pointer bg-transparent text-sm font-medium text-gray-800 outline-none"
                  >
                    <option value="">Select Profession</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="hidden w-px self-stretch bg-gray-200 sm:block" aria-hidden="true" />
                <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-gray-50/80 px-4 py-3">
                  <MapPin size={18} className="shrink-0 text-emerald-600" aria-hidden="true" />
                  <label htmlFor="home-city" className="sr-only">City or area</label>
                  <input
                    id="home-city"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Enter city or area"
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:from-emerald-700 hover:to-teal-600"
                >
                  <Search size={16} aria-hidden="true" />
                  Search
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-emerald-200/80">Popular:</span>
                {['Plumber', 'Electrician', 'Carpenter', 'Painter'].map((p) => (
                  <Link
                    key={p}
                    href={`/search?q=${p.toLowerCase()}`}
                    className="rounded-full bg-white/10 px-3.5 py-1.5 text-emerald-50 ring-1 ring-white/15 transition-colors hover:bg-white/20"
                  >
                    {p}
                  </Link>
                ))}
              </div>

              <Link
                href="/search?available=1"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-gray-900 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-300 hover:to-orange-400"
              >
                <Flame size={16} aria-hidden="true" />Urgent? Find same-day help
              </Link>
            </div>

            {/* Right: social proof */}
            <div className="relative hidden lg:block">
              <div className="rounded-3xl bg-white/10 p-7 shadow-2xl shadow-black/20 ring-1 ring-white/15 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-1 text-amber-400" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} className="fill-current" />
                  ))}
                </div>
                <p className="font-display text-xl leading-relaxed text-white">
                  &ldquo;Emeka fixed our burst pipe within the hour. Fair price, spotless work — I&apos;ve found my forever plumber.&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <Image
                    src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&auto=format"
                    alt="Adaeze O., a satisfied customer"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white/30"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">Adaeze O.</p>
                    <p className="text-xs text-emerald-200">Lagos, Nigeria</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <ShieldCheck size={13} aria-hidden="true" /> Verified
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-5 rounded-2xl bg-amber-400 px-5 py-3 shadow-xl shadow-amber-900/30">
                <p className="font-display text-2xl font-bold leading-none text-gray-900">4.8/5</p>
                <p className="mt-0.5 text-[11px] font-semibold text-amber-900/80">Average rating</p>
              </div>
            </div>
          </div>

          {/* ── Stats band ─────────────────────────────────────────────── */}
          <div className="mt-14 border-t border-white/10 pt-8 md:mt-16">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {statTiles.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} shadow-lg`}>
                      <Icon size={22} className="text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold leading-none text-white md:text-3xl">
                        <CountUp value={s.value} suffix={s.suffix} />
                      </p>
                      <p className="mt-1.5 text-xs text-emerald-200 md:text-sm">{s.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Browse
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-gray-900 md:text-4xl">Popular Categories</h2>
            <p className="mt-2 text-gray-500">Browse by what you need done — top trade experts at your service</p>
          </div>
          <Link href="/search" className="group hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#047857] hover:text-[#047857] md:inline-flex">
            View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.slice(0, 8).map((cat) => {
            const meta = CATEGORY_META[cat.name] ?? FALLBACK_META
            const Icon = meta.icon
            const count = categoryCounts[cat.name] ?? 0
            return (
              <Link
                key={cat.name}
                href={`/search?category=${encodeURIComponent(cat.name)}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5 hover:ring-emerald-200"
              >
                <div aria-hidden className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${meta.grad} opacity-[0.08] transition-opacity group-hover:opacity-20`} />
                <div className="mb-5 flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.grad} text-white shadow-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110`}>
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <ArrowUpRight size={18} className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#047857]" aria-hidden="true" />
                </div>
                <p className="font-semibold text-gray-900 transition-colors group-hover:text-[#047857]">{cat.name}</p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${meta.grad}`} />
                  {count.toLocaleString()} {count === 1 ? 'artisan' : 'artisans'}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Featured Artisans ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-emerald-50/80 to-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Top rated
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-gray-900 md:text-4xl">Featured Artisans</h2>
              <p className="mt-2 text-gray-500">Professionals customers love — rated and reviewed by real people</p>
            </div>
            <Link href="/search" className="group hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#047857] hover:text-[#047857] md:inline-flex">
              View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artisans.map((a) => (
              <ArtisanCard key={a.id} artisan={a} />
            ))}
          </div>
          {artisans.length === 0 && (
            <p className="py-8 text-center text-gray-600" role="status">No artisans yet. They&apos;ll appear here once the backend is seeded.</p>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" /> Simple &amp; secure
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-gray-900 md:text-4xl">How It Works</h2>
          <p className="mt-2 text-lg text-gray-500">Three simple steps to get the job done right</p>
        </div>
        <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
          <div aria-hidden className="absolute inset-x-16 top-10 hidden h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent md:block" />
          {HOW_IT_WORKS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="group relative rounded-3xl border border-gray-100 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5 hover:ring-emerald-200">
                <span className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shadow-md ring-4 ring-white">
                  {s.step}
                </span>
                <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${s.grad} text-white shadow-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105`}>
                  <Icon size={30} aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2.5 leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="mx-6 max-w-6xl overflow-hidden rounded-3xl md:mx-auto md:mb-20">
        <div className="relative bg-gradient-to-br from-[#047857] via-[#065f46] to-[#022c22] px-8 py-12 md:px-14 md:py-14">
          <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Are you a skilled artisan?</h2>
              <p className="mt-2 text-emerald-200">
                Join Nigeria&apos;s growing network of verified artisans. Free to register — get job requests from day one.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 text-center font-bold text-gray-900 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-300 hover:to-orange-400"
              >
                Join Now — Free
              </Link>
              <Link
                href="/search"
                className="rounded-xl bg-white/10 px-7 py-3.5 text-center font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Explore Artisans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
