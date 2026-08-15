'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, CheckCircle, SlidersHorizontal, AlertTriangle, Star, RefreshCw, X } from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import { fetchArtisans } from '@/lib/api'
import { formatNGN, minServiceRate } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StarRating from '@/components/StarRating'
import SkillBadges from '@/components/SkillBadges'
import type { Artisan } from '@/types'

const PRICE_BANDS: { id: string; label: string; min?: number; max?: number }[] = [
  { id: 'any', label: 'Any price' },
  { id: 'under-5000', label: 'Under ₦5,000', max: 5000 },
  { id: '5000-10000', label: '₦5,000 – ₦10,000', min: 5000, max: 10000 },
  { id: '10000-20000', label: '₦10,000 – ₦20,000', min: 10000, max: 20000 },
  { id: 'over-20000', label: 'Over ₦20,000', min: 20000 },
]

function SearchPage() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialCity = searchParams.get('city') || ''
  const initialCategory = searchParams.get('category') || 'All'
  const [category, setCategory] = useState(initialCategory)
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState('Rating')
  const [keyword, setKeyword] = useState(initialQ)
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialQ)
  const [city, setCity] = useState(initialCity)
  const [availableOnly, setAvailableOnly] = useState(() => searchParams.get('available') === '1')
  const [priceBand, setPriceBand] = useState('any')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError('')
    const params: Record<string, string> = {}
    if (debouncedKeyword.trim()) params.q = debouncedKeyword.trim()
    if (category !== 'All') params.category = category
    if (city.trim()) params.city = city.trim()
    if (minRating > 0) params.minRating = String(minRating)
    if (availableOnly) params.available = 'true'
    if (priceBand !== 'any') {
      const band = PRICE_BANDS.find((b) => b.id === priceBand)
      if (band?.min) params.minPrice = String(band.min)
      if (band?.max) params.maxPrice = String(band.max)
    }
    if (location) {
      params.lat = String(location.lat)
      params.lng = String(location.lng)
      params.radius = '50'
      params.sortBy = 'distance'
    } else {
      params.sortBy = sortBy === 'Rating' ? 'rating' : 'hourlyRate'
    }
    fetchArtisans(params)
      .then((data) => {
        if (requestId === requestIdRef.current) {
          setArtisans(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError('Could not load artisans. Check your connection and try again.')
          setLoading(false)
        }
      })
  }, [category, minRating, sortBy, debouncedKeyword, city, availableOnly, priceBand, location, reload])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location is not supported by this browser.')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSortBy('Nearest')
        setLocating(false)
      },
      () => {
        setLocError('Location unavailable — filter by city instead.')
        setLocating(false)
      },
      { timeout: 10_000 },
    )
  }

  const clearFilters = () => {
    setCategory('All')
    setMinRating(0)
    setCity('')
    setKeyword('')
    setPriceBand('any')
    setAvailableOnly(false)
    if (location) {
      setLocation(null)
      setSortBy('Rating')
    }
  }

  const activeFilters = [
    { key: 'category', label: category !== 'All' ? category : null, clear: () => setCategory('All') },
    { key: 'rating', label: minRating > 0 ? `${minRating}+ stars` : null, clear: () => setMinRating(0) },
    { key: 'price', label: priceBand !== 'any' ? PRICE_BANDS.find((b) => b.id === priceBand)?.label ?? null : null, clear: () => setPriceBand('any') },
    { key: 'city', label: city.trim() || null, clear: () => setCity('') },
    { key: 'available', label: availableOnly ? 'Available now' : null, clear: () => setAvailableOnly(false) },
    { key: 'location', label: location ? 'Near me' : null, clear: () => { setLocation(null); setSortBy('Rating') } },
  ].filter((f) => f.label)
  const activeCount = activeFilters.length

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <h1 className="sr-only">Find Artisans</h1>
      {/* Top search bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name, skill or category…"
              aria-label="Search by name, skill or category"
              className="flex-1 text-sm outline-none bg-transparent text-gray-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-gray-500 hidden sm:inline">Sort:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={!!location}
              aria-label="Sort results"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              {location ? (
                <option>Nearest</option>
              ) : (
                <>
                  <option>Rating</option>
                  <option>Hourly Rate</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Filter bar — collapsed by default, active filters shown as chips */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filtersOpen ? 'text-white bg-[#047857]' : 'text-gray-700 border border-gray-200 hover:border-[#047857] hover:text-[#047857]'}`}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center" aria-label={`${activeCount} active filters`}>
                {activeCount}
              </span>
            )}
          </button>
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {activeFilters.map((f) => (
              <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#047857] text-xs font-medium">
                {f.label}
                <button
                  onClick={f.clear}
                  aria-label={`Remove filter ${f.label}`}
                  className="hover:text-[#065f46] transition-colors"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
            {activeCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div id="filter-panel" role="region" aria-label="Filters" className="bg-gray-50/70 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Refine results</p>
              {activeCount > 0 && (
                <button onClick={clearFilters} className="text-xs font-semibold text-[#047857] hover:underline transition-colors">
                  Reset all filters
                </button>
              )}
            </div>
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {['All', ...CATEGORIES.map((c) => c.name)].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === c ? 'border-[#047857] bg-[#047857] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#047857] hover:text-[#047857]'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Min. Rating</p>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 4, 4.5, 4.8].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      aria-pressed={minRating === r}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${minRating === r ? 'border-[#047857] bg-[#047857] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#047857] hover:text-[#047857]'}`}
                    >
                      <Star size={11} className="fill-current opacity-80" aria-hidden="true" />
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_BANDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setPriceBand(b.id)}
                      aria-pressed={priceBand === b.id}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${priceBand === b.id ? 'border-[#047857] bg-[#047857] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#047857] hover:text-[#047857]'}`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</p>
                <div className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-3 py-2">
                  <MapPin size={14} className="text-gray-400 shrink-0" aria-hidden="true" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City or area"
                    aria-label="Filter by city or area"
                    className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  />
                </div>
                {location ? (
                  <div className="mt-2 flex items-center justify-between gap-2 bg-[#ECFDF5] border border-emerald-200 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-emerald-800">Using your location</span>
                    <button
                      onClick={() => { setLocation(null); setSortBy('Rating') }}
                      className="text-xs font-semibold text-[#047857] hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:border-[#047857] hover:text-[#047857] transition-colors disabled:opacity-60"
                  >
                    <MapPin size={14} aria-hidden="true" />
                    {locating ? 'Locating…' : 'Use my location'}
                  </button>
                )}
                {locError && <p className="text-xs text-red-600 mt-1.5" role="alert">{locError}</p>}
              </div>

              <div className="sm:col-span-2 xl:col-span-4 border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="w-5 h-5 rounded accent-emerald-600"
                  />
                  <span className="text-sm text-gray-600">Available now only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4" role="status" aria-live="polite">
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
            <div className="text-center py-16" role="alert">
              <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
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
                  className="w-16 h-16 rounded-xl object-cover shrink-0 self-start"
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
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin size={11} aria-hidden="true" />{a.city}
                        </span>
                        {a.distanceKm != null && (
                          <span className="text-xs text-gray-600">{a.distanceKm} km away</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {minServiceRate(a.services) != null ? (
                        <p className="font-bold text-gray-900">
                          From <span className="text-xs font-semibold text-gray-500">{formatNGN(minServiceRate(a.services)!)}</span>
                        </p>
                      ) : (
                        <p className="font-bold text-gray-900">
                          {formatNGN(a.hourlyRate)}<span className="text-xs font-normal text-gray-600">/hr</span>
                        </p>
                      )}
                      <div className={`text-xs mt-1 font-medium ${a.available ? 'text-emerald-700' : 'text-gray-600'}`}>
                        {a.available ? '● Available now' : '○ Busy'}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.bio}</p>
                  <SkillBadges services={a.services} limit={3} className="mt-2" />
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
                        href={`/artisans/${a.id}?book=1`}
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
                <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-500 font-medium">No artisans match your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm font-medium text-[#047857]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          )}
        </div>
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
