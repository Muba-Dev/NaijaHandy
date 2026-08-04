'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, CheckCircle } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import StarRating from '@/components/StarRating'
import { fetchSavedArtisans, unsaveArtisan } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import type { Artisan } from '@/types'

export default function SavedArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSavedArtisans().then(setArtisans).catch(() => setArtisans([])).finally(() => setLoading(false))
  }, [])

  const handleUnsave = async (id: string) => {
    try {
      await unsaveArtisan(id)
      setArtisans((as) => as.filter((a) => a.id !== id))
    } catch {}
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Saved Artisans</h1>
            <p className="text-gray-500 text-sm mt-0.5">Artisans you&apos;ve bookmarked for later</p>
          </div>
          <Link
            href="/search"
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity"
          >
            Find More
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : artisans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Heart size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No saved artisans yet</p>
            <p className="text-sm text-gray-400 mt-1">Tap the save button on any artisan profile to keep them here.</p>
            <Link
              href="/search"
              className="mt-4 inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity"
            >
              Browse Artisans
            </Link>
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
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <StarRating value={a.rating} count={a.reviews} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUnsave(a.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Heart size={14} className="fill-current" /> Unsave
                      </button>
                      <Link
                        href={`/artisans/${a.id}`}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#047857] hover:opacity-90 transition-opacity"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  )
}
