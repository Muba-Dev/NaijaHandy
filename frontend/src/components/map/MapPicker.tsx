'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Search, MapPin, Loader2 } from 'lucide-react'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-72 rounded-xl bg-gray-100 animate-pulse" role="status">
      <span className="sr-only">Loading map…</span>
    </div>
  ),
})

const NOMINATIM = 'https://nominatim.openstreetmap.org'

export default function MapPicker({
  lat,
  lng,
  address,
  onSelect,
  onAddressChange,
}: {
  lat: number | null
  lng: number | null
  address: string
  onSelect: (lat: number, lng: number, address?: string) => void
  onAddressChange: (address: string) => void
}) {
  const [query, setQuery] = useState(address)
  const [searching, setSearching] = useState(false)
  const [msg, setMsg] = useState('')
  const typedAfterClick = useRef(false)

  useEffect(() => {
    setQuery(address)
  }, [address])

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setMsg('')
    try {
      const res = await fetch(`${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`)
      const results = await res.json()
      if (Array.isArray(results) && results[0]) {
        const r = results[0]
        onSelect(Number(r.lat), Number(r.lon), r.display_name)
        setQuery(r.display_name)
      } else {
        setMsg('No location found. Try a more specific search.')
      }
    } catch {
      setMsg('Search failed. Please check your connection.')
    } finally {
      setSearching(false)
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    typedAfterClick.current = false
    onSelect(lat, lng)
    try {
      const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data?.display_name && !typedAfterClick.current) {
        onSelect(lat, lng, data.display_name)
        setQuery(data.display_name)
      }
    } catch {
      if (!typedAfterClick.current) setQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    }
  }

  return (
    <div>
      <form onSubmit={search} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onAddressChange(e.target.value)
              typedAfterClick.current = true
            }}
            placeholder="Search address, street or area…"
            aria-label="Search address"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#047857] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {searching ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
          Search
        </button>
      </form>
      {msg && (
        <p role="alert" className="text-xs text-red-600 mb-2">{msg}</p>
      )}
      <MapView lat={lat ?? 6.4541} lng={lng ?? 3.3947} interactive onSelect={handleMapClick} />
      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        <MapPin size={12} aria-hidden="true" />
        Click anywhere on the map to place your pin.
      </p>
    </div>
  )
}
