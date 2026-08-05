'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, CheckCircle, Star, Phone, MessageSquare, Heart, Wrench } from 'lucide-react'
import { fetchArtisanById, createBooking, initializePayment, fetchSavedArtisans, saveArtisan, unsaveArtisan } from '@/lib/api'
import { formatNGN, isAuthenticated, getApiErrorMessage } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StarRating from '@/components/StarRating'
import type { Artisan } from '@/types'

export default function ArtisanProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    fetchArtisanById(params.id).then(setArtisan).catch(() => setArtisan(null)).finally(() => setLoading(false))

    if (isAuthenticated()) {
      fetchSavedArtisans()
        .then((list) => setSaved(list.some((a) => a.id === params.id)))
        .catch(() => setSaved(false))
    }
  }, [params.id])

  const toggleSave = async () => {
    if (!artisan) return
    if (!isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent(`/artisans/${artisan.id}`)}`)
      return
    }
    setSaving(true)
    try {
      if (saved) {
        await unsaveArtisan(artisan.id)
        setSaved(false)
      } else {
        await saveArtisan(artisan.id)
        setSaved(true)
      }
    } catch {
      setSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  const ratingDistribution = (() => {
    const counts = [0, 0, 0, 0, 0]
    for (const r of artisan?.reviews_list || []) {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1))
      counts[idx] += 1
    }
    const total = counts.reduce((s, c) => s + c, 0)
    return total ? counts.map((c) => Math.round((c / total) * 100)) : counts
  })()

  const handleBook = async () => {
    if (!artisan) return
    setBookingSubmitting(true)
    setBookingError('')
    try {
      const booking = await createBooking({
        artisanId: artisan.id,
        date: bookingDate,
        time: bookingTime,
        description: jobDesc,
        amount: artisan.hourlyRate * 2 + 500,
      })
      try {
        const { authorization_url } = await initializePayment(booking.id)
        window.location.href = authorization_url
        return
      } catch {
        setBookingSuccess(true)
      }
    } catch (err) {
      setBookingError(getApiErrorMessage(err, 'Please log in first to book an artisan.'))
    } finally {
      setBookingSubmitting(false)
    }
  }

  const tabs = ['about', 'services', 'portfolio', 'reviews']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-52 md:h-64 bg-gray-200" />
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 -mt-14 relative z-10 p-6 mb-6 flex gap-5 items-center">
            <div className="w-24 h-24 rounded-2xl bg-gray-100" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Artisan not found</h1>
          <Link href="/search" className="text-sm font-medium text-[#047857]">Back to search</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="h-52 md:h-64 relative overflow-hidden bg-[#022c22]">
        {artisan.cover && (
          <Image src={artisan.cover} alt="cover" fill className="object-cover opacity-50" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 -mt-14 relative z-10 p-6 mb-6 flex flex-col md:flex-row gap-5 items-start md:items-center">
          <Image
            src={artisan.avatar || DEFAULT_AVATAR}
            alt={artisan.name}
            width={96}
            height={96}
            className="rounded-2xl object-cover border-4 border-white shadow-lg shrink-0 -mt-10 md:mt-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-gray-900">{artisan.name}</h1>
              {artisan.verified && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857]">
                  <CheckCircle size={12} /> Verified Artisan
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-0.5">{artisan.profession}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{artisan.city}</span>
              <StarRating value={artisan.rating} count={artisan.reviews} />
              <span className={`text-sm font-medium ${artisan.available ? 'text-emerald-600' : 'text-gray-400'}`}>
                {artisan.available ? '● Available Now' : '○ Currently Busy'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Phone size={15} />Call
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageSquare size={15} />Message
            </button>
            <button
              onClick={toggleSave}
              disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60 ${saved ? 'border-[#047857] bg-[#ECFDF5] text-[#047857]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Heart size={15} className={saved ? 'fill-current' : ''} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 pb-12">
          {/* Tabbed main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-5 py-4 text-sm font-semibold capitalize whitespace-nowrap transition-colors ${activeTab === t ? 'border-b-2 border-[#047857] text-[#047857]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t === 'about' ? 'About / Bio' : t === 'services' ? 'Services & Pricing' : t === 'portfolio' ? 'Portfolio' : 'Reviews'}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === 'about' && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-3">About {artisan.name}</h3>
                    <p className="text-gray-600 leading-relaxed">{artisan.bio}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                      {[
                        { label: 'Hourly Rate', value: formatNGN(artisan.hourlyRate) },
                        { label: 'Jobs Completed', value: `${artisan.reviews}+` },
                        { label: 'Avg. Rating', value: `${artisan.rating} / 5` },
                        { label: 'Verification', value: artisan.verified ? 'Verified' : 'Pending' },
                        { label: 'Availability', value: artisan.available ? 'Available now' : 'Currently busy' },
                        { label: 'Location', value: artisan.city || 'Nigeria' },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                          <p className="font-semibold text-gray-900 text-sm">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Services & Pricing</h3>
                    {artisan.services.length > 0 ? (
                      <div className="space-y-3">
                        {artisan.services.map((s) => (
                          <div key={s.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#ECFDF5]">
                                <Wrench size={15} className="text-[#047857]" />
                              </div>
                              <span className="font-medium text-gray-800">{s.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{formatNGN(s.rate)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No services listed yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Portfolio</h3>
                    {artisan.portfolio.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {artisan.portfolio.map((img, i) => (
                          <Image key={i} src={img} alt={`portfolio ${i + 1}`} width={400} height={300} className="rounded-xl w-full h-40 object-cover hover:scale-105 transition-transform cursor-pointer" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No portfolio items yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <p className="font-display text-5xl font-bold text-gray-900">{artisan.rating}</p>
                        <div className="flex gap-0.5 mt-1 justify-center">
                          {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{artisan.reviews} reviews</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((n) => (
                          <div key={n} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-2">{n}</span>
                            <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#047857]" style={{ width: `${ratingDistribution[5 - n]}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {artisan.reviews_list.map((r, i) => (
                        <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-start gap-3">
                            <Image src={r.avatar || DEFAULT_AVATAR} alt={r.name} width={40} height={40} className="rounded-full object-cover" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                                <span className="text-xs text-gray-400">{r.date}</span>
                              </div>
                              <div className="flex gap-0.5 my-1">
                                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                              </div>
                              <p className="text-sm text-gray-600">{r.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {artisan.reviews_list.length === 0 && <p className="text-gray-400 text-sm">No reviews yet.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky booking sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-display text-2xl font-bold text-gray-900">{formatNGN(artisan.hourlyRate)}</span>
                  <span className="text-gray-400 text-sm">/hr</span>
                </div>
                <StarRating value={artisan.rating} count={artisan.reviews} />
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#047857] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#047857] transition-colors"
                  >
                    <option value="">Select time slot</option>
                    {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Description</label>
                  <textarea
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Describe the job in detail..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#047857] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service fee (est. 2hrs)</span>
                  <span className="text-gray-700">{formatNGN(artisan.hourlyRate * 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform fee</span>
                  <span className="text-gray-700">{formatNGN(500)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900">Estimated Total</span>
                  <span className="text-[#047857]">{formatNGN(artisan.hourlyRate * 2 + 500)}</span>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={bookingSubmitting || !bookingDate || !bookingTime || !jobDesc}
                className="block w-full py-3.5 rounded-xl text-white font-semibold text-sm text-center bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {bookingSubmitting ? 'Booking…' : bookingSuccess ? 'Booking Created — Pay Later ✓' : 'Proceed to Book & Pay'}
              </button>
              {bookingError && <p className="text-center text-xs text-red-500 mt-2">{bookingError}</p>}
              <p className="text-center text-xs text-gray-400 mt-2.5">You&apos;ll be redirected to secure Paystack checkout to complete payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
