'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBooking, initializePayment, fetchSavedArtisans, saveArtisan, unsaveArtisan, fetchMe, updateProfile } from '@/lib/api'
import { isAuthenticated, getApiErrorMessage, getStoredUser, estimateBookingAmount } from '@/lib/utils'
import type { Artisan, AuthUser } from '@/types'
import ProfileHeader from '@/components/artisan/ProfileHeader'
import ProfileTabs from '@/components/artisan/ProfileTabs'
import BookingCard from '@/components/artisan/BookingCard'

export default function ArtisanProfileClient({ artisan }: { artisan: Artisan | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const toggleSave = async () => {
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

  const todayISO = () => new Date().toLocaleDateString('en-CA')

  const estimate = estimateBookingAmount(artisan.services, selectedService, hours, artisan.hourlyRate)

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
    artisanId: artisan.id,
    date: bookingDate || todayISO(),
    time: bookingTime || 'ASAP',
    description: jobDesc.trim() || `Booking request for ${selectedService || artisan.profession} service`,
    amount: estimate.total,
    address: jobAddress || undefined,
    customerPhone: contactPhone || undefined,
    isUrgent,
  })

  const handleBook = async () => {
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <ProfileHeader artisan={artisan} saved={saved} saving={saving} onToggleSave={toggleSave} />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="mt-8 flex flex-col gap-8 pb-12 lg:flex-row">
          {/* ── Main content ────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            <ProfileTabs artisan={artisan} />
          </div>

          {/* ── Booking sidebar ─────────────────────────────────────── */}
          <div id="booking-form" className="w-full shrink-0 lg:w-[22rem]">
            <BookingCard
              artisan={artisan}
              selectedService={selectedService}
              onServiceChange={setSelectedService}
              hours={hours}
              onHoursChange={setHours}
              bookingDate={bookingDate}
              onDateChange={setBookingDate}
              bookingTime={bookingTime}
              onTimeChange={setBookingTime}
              isUrgent={isUrgent}
              onUrgentChange={setIsUrgent}
              contactPhone={contactPhone}
              onPhoneChange={setContactPhone}
              jobAddress={jobAddress}
              onAddressChange={setJobAddress}
              jobDesc={jobDesc}
              onDescChange={setJobDesc}
              rebookActive={rebookActive}
              bookingSubmitting={bookingSubmitting}
              bookingSuccess={bookingSuccess}
              bookingError={bookingError}
              instantSent={instantSent}
              onInstantRequest={handleInstantRequest}
              onBook={handleBook}
            />
          </div>
        </div>
      </div>
    </div>
  )
}