'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MapPin, CheckCircle, Clock, XCircle, Star, Phone, MessageSquare, Heart, Wrench, Zap, RefreshCw, ShieldCheck,
  Check, ArrowLeft, Briefcase, BadgeCheck, Home,
} from 'lucide-react'
import { createBooking, initializePayment, fetchSavedArtisans, saveArtisan, unsaveArtisan, fetchMe, updateProfile } from '@/lib/api'
import { formatNGN, isAuthenticated, getApiErrorMessage, getStoredUser, buildWhatsAppLink, isWhatsAppPhone, estimateBookingAmount, minServiceRate } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import StarRating from '@/components/StarRating'
import SkillBadges from '@/components/SkillBadges'
import LocationMap from '@/components/map/LocationMap'
import type { Artisan, AuthUser } from '@/types'

export default function ArtisanProfileClient({ artisan }: { artisan: Artisan | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('about')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [selectedService, setSelectedService] = useState(() => artisan?.services[0]?.name ?? '')
  const [hours, setHours] = useState(2)
  const [rebookActive, setRebookActive] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [instantSent, setInstantSent] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!artisan) return
    if (isAuthenticated()) {
      fetchSavedArtisans()
        .then((list) => setSaved(list.some((a) => a.id === artisan.id)))
        .catch(() => setSaved(false))
    }
  }, [artisan])

  useEffect(() => {
    if (!isAuthenticated()) return
    const stored = getStoredUser<AuthUser>()
    if (stored?.phone) setContactPhone((p) => p || stored.phone || '')
    if (stored?.address) setJobAddress((a) => a || stored.address || '')
    fetchMe()
      .then((me) => {
        setContactPhone((p) => p || me.phone || '')
        setJobAddress((a) => a || me.address || '')
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (artisan && artisan.services.length > 0) {
      setSelectedService((current) => current || artisan.services[0].name)
    }
  }, [artisan])

  useEffect(() => {
    if (searchParams.get('bookagain') !== '1' && searchParams.get('book') !== '1') return
    const time = searchParams.get('time')
    const desc = searchParams.get('desc')
    if (time) setBookingTime(time)
    if (desc) setJobDesc(desc)
    if (searchParams.get('bookagain') === '1') setRebookActive(true)
    setBookingDate(new Date().toLocaleDateString('en-CA'))
    const t = window.setTimeout(() => {
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchParams])

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

  const estimate = estimateBookingAmount(artisan?.services ?? [], selectedService, hours, artisan?.hourlyRate ?? 0)

  const todayISO = () => new Date().toLocaleDateString('en-CA')

  const persistContact = () => {
    if (!isAuthenticated()) return
    if (contactPhone || jobAddress) {
      updateProfile({
        phone: contactPhone || undefined,
        address: jobAddress || undefined,
      }).catch(() => undefined)
    }
  }

  const buildBookingPayload = () => ({
    artisanId: artisan!.id,
    date: bookingDate || todayISO(),
    time: bookingTime || 'ASAP',
    description: jobDesc.trim() || `Booking request for ${selectedService || artisan!.profession} service`,
    amount: estimate.total,
    address: jobAddress || undefined,
    customerPhone: contactPhone || undefined,
    isUrgent,
  })

  const handleBook = async () => {
    if (!artisan) return
    setBookingSubmitting(true)
    setBookingError('')
    try {
      const booking = await createBooking(buildBookingPayload())
      persistContact()
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

  const handleInstantRequest = async () => {
    if (!artisan) return
    if (!isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent(`/artisans/${artisan.id}`)}`)
      return
    }
    if (!contactPhone.trim()) {
      setBookingError('Add your phone number below so the artisan can reach you.')
      document.getElementById('booking-phone')?.focus()
      return
    }
    setBookingSubmitting(true)
    setBookingError('')
    setInstantSent(false)
    try {
      await createBooking(buildBookingPayload())
      persistContact()
      setBookingDate(bookingDate || todayISO())
      setBookingTime(bookingTime || 'ASAP')
      setInstantSent(true)
    } catch (err) {
      setBookingError(getApiErrorMessage(err, 'Could not send your request. Please try again.'))
    } finally {
      setBookingSubmitting(false)
    }
  }

  const tabs = ['about', 'services', 'portfolio', 'reviews']

  const whatsappMessage = `Hello ${artisan?.name}! I found you on NaijaHandy and I have a question about your ${artisan?.profession} service before I book.`
  const whatsappLink = buildWhatsAppLink(artisan?.phone, whatsappMessage)

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

  const actionBtn =
    'inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#047857] hover:text-[#047857] hover:bg-emerald-50/50'

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-emerald-100'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ── Cover ──────────────────────────────────────────────────── */}
      <div className="relative h-52 md:h-72 overflow-hidden bg-gradient-to-br from-[#022c22] via-[#047857] to-[#065f46]">
        {artisan.cover && (
          <Image src={artisan.cover} alt="" fill className="object-cover opacity-40" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div aria-hidden className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute left-4 top-4 md:left-6 md:top-5">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to search
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* ── Profile header ───────────────────────────────────────── */}
        <div className="relative z-10 -mt-16 md:-mt-20">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-900/5 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <Image
                    src={artisan.avatar || DEFAULT_AVATAR}
                    alt={artisan.name}
                    width={112}
                    height={112}
                    className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white shadow-lg md:h-28 md:w-28"
                  />
                  {artisan.verified && (
                    <span
                      className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#047857] ring-4 ring-white"
                      title="Verified artisan"
                    >
                      <Check size={14} className="text-white" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">{artisan.name}</h1>
                    {artisan.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#047857]">
                        <ShieldCheck size={12} aria-hidden="true" /> Verified Artisan
                      </span>
                    )}
                    {artisan.verificationStatus === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Clock size={12} aria-hidden="true" /> Verification pending
                      </span>
                    )}
                    {artisan.verificationStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <XCircle size={12} aria-hidden="true" /> Verification rejected
                      </span>
                    )}

                  </div>

                  <p className="mt-1 text-gray-500 md:text-lg">{artisan.profession}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                      <MapPin size={14} className="text-[#047857]" aria-hidden="true" /> {artisan.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <StarRating value={artisan.rating} count={artisan.reviews} />
                    </span>
                    {artisan.available ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Available now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />
                        Currently busy
                      </span>
                    )}
                    {isWhatsAppPhone(artisan.phone) && artisan.available && (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Zap size={14} className="text-[#F59E0B]" aria-hidden="true" /> Quick responder
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-6">
                    <div>
                      <p className="font-display text-xl font-bold text-gray-900 md:text-2xl">{artisan.completedJobsCount}</p>
                      <p className="text-xs text-gray-500">Jobs completed</p>
                    </div>
                    <div className="border-l border-gray-100 pl-6">
                      <p className="font-display text-xl font-bold text-gray-900 md:text-2xl">{artisan.reviews}</p>
                      <p className="text-xs text-gray-500">Customer reviews</p>
                    </div>
                    <div className="border-l border-gray-100 pl-6">
                      <p className="font-display text-xl font-bold text-gray-900 md:text-2xl">{artisan.rating}<span className="text-sm text-gray-500">/5</span></p>
                      <p className="text-xs text-gray-500">Average rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-2 lg:ml-auto lg:flex-col">
                {artisan.phone ? (
                  <a href={`tel:${artisan.phone}`} className={actionBtn} aria-label={`Call ${artisan.name}`}>
                    <Phone size={15} aria-hidden="true" /> Call
                  </a>
                ) : (
                  <button className={actionBtn} aria-label={`Call ${artisan.name}`}>
                    <Phone size={15} aria-hidden="true" /> Call
                  </button>
                )}
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Message ${artisan.name} on WhatsApp`}
                    className={actionBtn}
                  >
                    <MessageSquare size={15} aria-hidden="true" /> Message
                  </a>
                ) : (
                  <button className={actionBtn} aria-label={`Message ${artisan.name}`}>
                    <MessageSquare size={15} aria-hidden="true" /> Message
                  </button>
                )}
                <button
                  onClick={toggleSave}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${saved ? 'border-[#047857] bg-emerald-50 text-[#047857]' : 'border-gray-200 text-gray-700 hover:border-[#047857] hover:text-[#047857] hover:bg-emerald-50/50'}`}
                >
                  <Heart size={15} className={saved ? 'fill-current' : ''} aria-hidden="true" />
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 pb-12 lg:flex-row">
          {/* ── Main content ────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
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
                  {tabs.map((t) => (
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
                {activeTab === 'about' && (
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
                )}

                {activeTab === 'services' && (
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
                )}

                {activeTab === 'portfolio' && (
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
                )}

                {activeTab === 'reviews' && (
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
                )}
              </div>
            </div>
          </div>

          {/* ── Booking sidebar ─────────────────────────────────────── */}
          <div id="booking-form" className="w-full shrink-0 lg:w-[22rem]">
            <div className="sticky top-20 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-900/5">
              {rebookActive && (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <RefreshCw size={13} aria-hidden="true" /> Rebooking {artisan.name}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">Your previous job details are pre-filled — pick a date and book again.</p>
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Starting price</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                {minServiceRate(artisan.services) != null ? (
                  <p className="font-display text-3xl font-bold text-gray-900">
                    {formatNGN(minServiceRate(artisan.services)!)}
                  </p>
                ) : (
                  <p className="font-display text-3xl font-bold text-gray-900">
                    {formatNGN(artisan.hourlyRate)}
                    <span className="text-base font-medium text-gray-500">/hr</span>
                  </p>
                )}
                <StarRating value={artisan.rating} count={artisan.reviews} />
              </div>
              <p className="mt-1 text-xs text-gray-500">Prices vary by job details and duration</p>

              <div className="mt-5 space-y-3">
                    <button
                      onClick={handleInstantRequest}
                      disabled={bookingSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-gray-900 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-300 hover:to-orange-400 disabled:opacity-50"
                    >
                      <Zap size={15} aria-hidden="true" />{bookingSubmitting ? 'Sending…' : 'Send Instant Request'}
                    </button>
                    <p className="-mt-1 text-center text-xs text-gray-500">One tap — we&apos;ll use today, ASAP and your saved contact details</p>

                    {instantSent && (
                      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                        <p className="text-sm font-semibold text-emerald-800">Instant request sent!</p>
                        <p className="mt-1 text-xs text-emerald-700">{artisan.name} will confirm your date and time shortly.</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />or customize below<span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
                    </div>

                    <div>
                      <label htmlFor="booking-date" className={labelCls}>Date</label>
                      <input
                        id="booking-date"
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="booking-time" className={labelCls}>Time</label>
                      <select
                        id="booking-time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select time slot</option>
                        <option value="ASAP">ASAP — any time</option>
                        {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3">
                      <input
                        type="checkbox"
                        checked={isUrgent}
                        onChange={(e) => setIsUrgent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-red-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-red-800">Urgent — I need this today</span>
                        <span className="mt-0.5 block text-xs text-red-700">The artisan gets an urgent-priority request. Available-now artisans show up first in search.</span>
                      </span>
                    </label>

                    {artisan.services.length > 0 && (
                      <div>
                        <label htmlFor="booking-service" className={labelCls}>Service</label>
                        <select
                          id="booking-service"
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className={inputCls}
                        >
                          {artisan.services.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name} — {formatNGN(s.rate)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="booking-duration" className={labelCls}>Duration</label>
                      <select
                        id="booking-duration"
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className={inputCls}
                      >
                        {[1, 2, 4, 8].map((h) => (
                          <option key={h} value={h}>{h} {h > 1 ? 'hours' : 'hour'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="booking-phone" className={labelCls}>Phone <span className="font-normal text-gray-500">(so the artisan can reach you)</span></label>
                      <input
                        id="booking-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="booking-address" className={labelCls}>Job Address <span className="font-normal text-gray-500">(where the work is)</span></label>
                      <input
                        id="booking-address"
                        type="text"
                        value={jobAddress}
                        onChange={(e) => setJobAddress(e.target.value)}
                        placeholder="e.g. 12 Admiralty Way, Lekki, Lagos"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="job-desc" className={labelCls}>Job Description</label>
                      <textarea
                        id="job-desc"
                        value={jobDesc}
                        onChange={(e) => setJobDesc(e.target.value)}
                        placeholder="Describe the job in detail..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
              </div>

              {/* Estimate */}
              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{selectedService ? `${selectedService} (${hours}hr${hours > 1 ? 's' : ''})` : `Service fee (est. ${hours}hrs)`}</span>
                  <span className="text-gray-700">{formatNGN(estimate.serviceFee)}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-sm">
                  <span className="text-gray-500">Platform fee</span>
                  <span className="text-gray-700">{formatNGN(estimate.platformFee)}</span>
                </div>
                <div className="mt-2.5 flex justify-between border-t border-gray-200 pt-2.5">
                  <span className="text-sm font-bold text-gray-900">Estimated Total</span>
                  <span className="font-display text-base font-bold text-[#047857]">{formatNGN(estimate.total)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#047857]">
                  <ShieldCheck size={14} aria-hidden="true" /> NaijaHandy Guarantee
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Paid bookings are protected — if the job isn&apos;t done right, we&apos;ll make it right.
                </p>
                <Link href="/guarantee" className="mt-1.5 inline-block text-xs font-medium text-[#047857] hover:underline">
                  Read the guarantee
                </Link>
              </div>

              <button
                onClick={handleBook}
                disabled={bookingSubmitting || !bookingDate || !bookingTime || !jobDesc}
                className="mt-4 block w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50"
              >
                {bookingSubmitting ? 'Booking…' : bookingSuccess ? 'Booking Created — Pay Later ✓' : 'Proceed to Book & Pay'}
              </button>
              {bookingError && <p className="mt-2 text-center text-xs text-red-600" role="alert">{bookingError}</p>}
              <p className="mt-2.5 text-center text-xs text-gray-500">Instant requests are free — you&apos;ll only pay when completing checkout</p>
              <Link href="/help" className="mt-2 block text-center text-xs font-medium text-[#047857] hover:underline">
                Need help? Visit our Help Centre
              </Link>

              {whatsappLink && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
                  <p className="text-xs text-gray-500">Questions before you book?</p>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#075E54] hover:underline"
                  >
                    <MessageSquare size={14} aria-hidden="true" /> Chat with {artisan.name} on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
