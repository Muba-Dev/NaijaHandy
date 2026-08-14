'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Search, Briefcase, MapPin, ArrowRight, Calendar, Shield,
  Wrench, Zap, Hammer, PaintBucket, Car, Scissors, Home, Layers, Flame,
} from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import { fetchArtisans, fetchCategoryCounts, fetchPlatformStats } from '@/lib/api'
import ArtisanCard from '@/components/ArtisanCard'
import type { Artisan, PlatformStats } from '@/types'

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

  const CATEGORY_ICONS = [Wrench, Zap, Hammer, PaintBucket, Car, Home, Scissors, Layers]

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

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #047857 60%, #065f46 100%)' }}
      >
        <Image
          src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&h=600&fit=crop&auto=format"
          alt=""
          fill
          className="object-cover opacity-15"
          priority
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {stats ? `${stats.artisans} verified artisans across Nigeria` : 'Trusted local artisans across Nigeria'}
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              Find Trusted<br />Local Artisans<br />
              <span className="text-amber-400">Near You</span>
            </h1>
            <p className="text-emerald-100 text-lg mb-8 leading-relaxed max-w-md">
              Connect with verified, skilled artisans across Nigeria. Safe payments. Guaranteed quality.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl max-w-xl">
              <div className="flex items-center gap-2 flex-1 px-3 py-2 border border-gray-100 rounded-xl">
                <Briefcase size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                <label htmlFor="home-profession" className="sr-only">Profession</label>
                <select
                  id="home-profession"
                  value={searchProfession}
                  onChange={(e) => setSearchProfession(e.target.value)}
                  className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                >
                  <option value="">Select Profession</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 px-3 py-2 border border-gray-100 rounded-xl">
                <MapPin size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                <label htmlFor="home-city" className="sr-only">City or area</label>
                <input
                  id="home-city"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Enter city or area"
                  className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm bg-[#047857] hover:opacity-90 transition-opacity shrink-0"
              >
                <Search size={16} aria-hidden="true" />
                Search
              </button>
            </form>
            <p className="text-emerald-200 text-sm mt-3">
              Popular:{' '}
              <Link href="/search?q=plumber" className="underline">Plumber</Link>,{' '}
              <Link href="/search?q=electrician" className="underline">Electrician</Link>,{' '}
              <Link href="/search?q=carpenter" className="underline">Carpenter</Link>
            </p>
            <Link
              href="/search?available=1"
              className="mt-4 inline-flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors"
            >
              <Flame size={16} aria-hidden="true" />Urgent? Find same-day help
            </Link>
          </div>

          {/* Stats grid */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Verified Artisans', value: stats ? String(stats.artisans) : '—' },
                { label: 'Cities Covered', value: stats ? String(stats.cities) : '—' },
                { label: 'Jobs Completed', value: stats ? stats.jobsCompleted.toLocaleString() : '—' },
                { label: 'Customer Reviews', value: stats ? stats.reviews.toLocaleString() : '—' },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
                  <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-emerald-200 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-3">
              <Image
                src="https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=48&h=48&fit=crop&auto=format"
                alt="artisan"
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-white"
              />
              <div>
                <p className="text-white text-sm font-semibold">Emeka Okafor · Master Plumber</p>
                <p className="text-emerald-300 text-xs mt-0.5">⭐ 4.8 — &ldquo;Fixed our burst pipe in under an hour&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900">Popular Categories</h2>
            <p className="text-gray-500 mt-1">Browse by what you need done</p>
          </div>
          <Link href="/search" className="hidden md:flex items-center gap-1 text-sm font-medium text-[#047857] hover:text-emerald-900">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => {
            const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length]
            const count = categoryCounts[cat.name] ?? 0
            return (
              <Link
                key={cat.name}
                href={`/search?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#ECFDF5]">
                  <Icon size={22} className="text-[#047857]" />
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-[#047857] transition-colors">{cat.name}</p>
                <p className="text-gray-600 text-sm mt-0.5">
                  {count.toLocaleString()} {count === 1 ? 'artisan' : 'artisans'}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Featured Artisans ─────────────────────────────────────────── */}
      <section className="bg-[#F0FDF4] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900">Featured Artisans</h2>
              <p className="text-gray-500 mt-1">Top-rated professionals in your area</p>
            </div>
            <Link href="/search" className="hidden md:flex items-center gap-1 text-sm font-medium text-[#047857] hover:text-emerald-900">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {artisans.map((a) => (
              <ArtisanCard key={a.id} artisan={a} />
            ))}
          </div>
          {artisans.length === 0 && (
            <p className="text-center text-gray-600 py-8" role="status">No artisans yet. They&apos;ll appear here once the backend is seeded.</p>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-2 text-lg">Three simple steps to get the job done</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-emerald-100" />
          {[
            { step: '01', icon: Search, title: 'Search', desc: 'Browse verified artisans by profession, location, or rating. Compare profiles and reviews.' },
            { step: '02', icon: Calendar, title: 'Book', desc: 'Select a date and time that works for you. Describe the job and get an instant estimate.' },
            { step: '03', icon: Shield, title: 'Pay Safely', desc: 'Your payment is held in escrow and only released when the job is done to your satisfaction.' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="text-center relative z-10">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-100 flex items-center justify-center mx-auto mb-6 bg-white shadow-lg">
                  <Icon size={32} className="text-[#047857]" />
                </div>
                <div className="inline-block bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded mb-2">{s.step}</div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section
        className="mx-6 md:mx-auto max-w-6xl mb-20 rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #047857, #065f46)' }}
      >
        <div className="relative px-8 md:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">Are you a skilled artisan?</h2>
            <p className="text-emerald-200 max-w-md">Join Nigeria&apos;s growing network of verified artisans. Free to register. Get job requests from day one.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/register" className="px-6 py-3 bg-amber-400 text-gray-900 font-semibold rounded-xl hover:bg-amber-300 transition-colors">
              Join Now — Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
