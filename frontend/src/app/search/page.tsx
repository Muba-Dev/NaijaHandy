'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, CheckCircle, Filter, SlidersHorizontal, AlertTriangle, Star, RefreshCw } from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import { fetchArtisans } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StarRating from '@/components/StarRating'
import type { Artisan } from '@/types'

function SearchPage() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialCity = searchParams.get('city') || ''
  const [category, setCategory] = useState('All')
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState('Rating')
  const [keyword, setKeyword] = useState(initialQ)
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialQ)
  const [city, setCity] = useState(initialCity)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [mobileFilter, setMobileFilter] = useState(false)
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params: Record<string, string> = {}
    if (debouncedKeyword.trim()) params.q = debouncedKeyword.trim()
    if (category !== 'All') params.category = category
    if (city.trim()) params.city = city.trim()
    if (minRating > 0) params.minRating = String(minRating)
    if (availableOnly) params.available = 'true'
    params.sortBy = sortBy === 'Rating' ? 'rating' : 'hourlyRate'
    fetchArtisans(params)
      .then(setArtisans)
      .catch(() => setError('Could not load artisans. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }, [category, minRating, sortBy, debouncedKeyword, city, availableOnly, reload])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Top search bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name, skill or category…"
              className="flex-1 text-sm outline-none bg-transparent text-gray-700"
            />
          </div>
          <button
            onClick={() => setMobileFilter(!mobileFilter)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700"
          >
            <Filter size={15} /> Filters
          </button>
          <div className="hidden md:flex items-center gap-2">
            <label className="text-sm text-gray-500">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
            >
              <option>Rating</option>
              <option>Hourly Rate</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-6">
        {/* Filter sidebar */}
        <aside className={`${mobileFilter ? 'block' : 'hidden'} md:block w-64 shrink-0`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
              <div className="space-y-1.5">
                {['All', ...CATEGORIES.map((c) => c.name)].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === c ? 'text-white font-medium bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Min. Rating</p>
              <div className="space-y-1.5">
                {[0, 4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${minRating === r ? 'text-white font-medium bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Star size={12} className="fill-current opacity-80" />
                    {r === 0 ? 'Any rating' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</p>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City or area"
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Availability</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-gray-600">Available now only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{loading ? '…' : artisans.length}</span> artisans
              {category !== 'All' ? ` in ${category}` : city ? ` in ${city}` : ' across Nigeria'}
            </p>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{error}</p>
              <button
                onClick={() => setReload((r) => r + 1)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#047857]"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
          <div className="space-y-4">
            {artisans.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row gap-4 hover:shadow-lg transition-shadow">
                <Image
                  src={a.avatar || DEFAULT_AVATAR}
                  alt={a.name}
                  width={64}
                  height={64}
                  className="rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900">{a.name}</h3>
                        {a.verified && <CheckCircle size={15} className="text-[#047857]" />}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                          {a.profession}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} />{a.city}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">
                        {formatNGN(a.hourlyRate)}<span className="text-xs font-normal text-gray-400">/hr</span>
                      </p>
                      <div className={`text-xs mt-1 font-medium ${a.available ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {a.available ? '● Available now' : '○ Busy'}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.bio}</p>
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <StarRating value={a.rating} count={a.reviews} />
                    <div className="flex gap-2">
                      <Link
                        href={`/artisans/${a.id}`}
                        className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-[#047857] hover:text-[#047857] transition-colors"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/artisans/${a.id}`}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {artisans.length === 0 && !loading && (
              <div className="text-center py-16">
                <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No artisans match your filters</p>
                <button
                  onClick={() => { setCategory('All'); setMinRating(0); setCity(''); setKeyword('') }}
                  className="mt-2 text-sm font-medium text-[#047857]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] bg-gray-50" />}>
      <SearchPage />
    </Suspense>
  )
}
