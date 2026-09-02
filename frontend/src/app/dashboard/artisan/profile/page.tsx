'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { BadgeCheck, MapPin, Star, Save, Loader2, Camera, ImagePlus, Trash2, ShieldCheck, Upload } from 'lucide-react'
import { fetchMyArtisanProfile, updateArtisanProfile, updateArtisanCover, uploadPortfolioItem, deletePortfolioItem, updateProfile, submitVerificationDocument, updateAvatar } from '@/lib/api'
import { formatNGN, getApiErrorMessage, readImageAsDataUrl, setStoredUser } from '@/lib/utils'
import { CATEGORIES, DEFAULT_AVATAR } from '@/lib/data'
import MapPicker from '@/components/map/MapPicker'
import Alert from '@/components/ui/Alert'
import useImageUpload from '@/hooks/useImageUpload'
import type { Artisan, PortfolioItem } from '@/types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

function validateImage(file: File): string {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Please choose an image file (JPG, PNG, WebP or GIF).'
  if (file.size > MAX_IMAGE_BYTES) return 'Image is too large. Maximum size is 4MB.'
  return ''
}

export default function MyProfilePage() {
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [form, setForm] = useState({ profession: '', category: '', bio: '', hourlyRate: '' })
  const [available, setAvailable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [pendingCover, setPendingCover] = useState('')
  const [coverStatus, setCoverStatus] = useState<'idle' | 'uploading' | 'saved' | 'error'>('idle')
  const [coverError, setCoverError] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)

  const { status: avatarStatus, error: avatarError, handleFile: uploadAvatarFile } = useImageUpload({
    validate: validateImage,
    fallbackError: 'Failed to update profile picture. Please try again.',
  })
  const { status: portfolioStatus, error: portfolioError, handleFile: uploadPortfolioFile, setStatus: setPortfolioStatus, setError: setPortfolioError } = useImageUpload({
    pipeline: 'raw',
    validate: validateImage,
    fallbackError: 'Failed to add photo. Please try again.',
  })
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [portfolioCaption, setPortfolioCaption] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const portfolioInputRef = useRef<HTMLInputElement>(null)

  const [pendingVerificationDoc, setPendingVerificationDoc] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'uploading' | 'saved' | 'error'>('idle')
  const [verificationError, setVerificationError] = useState('')
  const verificationInputRef = useRef<HTMLInputElement>(null)

  const [locationAddress, setLocationAddress] = useState('')
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [savingLocation, setSavingLocation] = useState(false)
  const [locationSaved, setLocationSaved] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    fetchMyArtisanProfile().then((p) => {
      setArtisan(p)
      setForm({
        profession: p.profession,
        category: p.category,
        bio: p.bio,
        hourlyRate: String(p.hourlyRate || ''),
      })
      setAvailable(p.available)
      setLocationAddress(p.address || '')
      setLocationLat(p.latitude ?? null)
      setLocationLng(p.longitude ?? null)
    }).catch(() => setArtisan(null))
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setSaved(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await updateArtisanProfile({
        profession: form.profession,
        category: form.category,
        bio: form.bio,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        available,
      })
      setSaved(true)
      fetchMyArtisanProfile().then(setArtisan).catch(() => undefined)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to save profile. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadAvatarFile(file, async (dataUrl) => {
      const updated = await updateAvatar(dataUrl)
      setArtisan((a) => (a ? { ...a, avatar: updated.avatar || a.avatar } : a))
      setStoredUser(updated)
    })
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverStatus('idle')
    setCoverError('')
    const message = validateImage(file)
    if (message) {
      setCoverStatus('error')
      setCoverError(message)
      if (coverInputRef.current) coverInputRef.current.value = ''
      return
    }
    try {
      const dataUrl = await readImageAsDataUrl(file)
      setPendingCover(dataUrl)
    } catch {
      setCoverStatus('error')
      setCoverError('Could not read the selected image. Please try again.')
    }
  }

  const handleUploadCover = async () => {
    if (!pendingCover) return
    setCoverStatus('uploading')
    setCoverError('')
    try {
      await updateArtisanCover(pendingCover)
      setPendingCover('')
      setCoverStatus('saved')
      if (coverInputRef.current) coverInputRef.current.value = ''
      fetchMyArtisanProfile().then(setArtisan).catch(() => undefined)
    } catch (err: unknown) {
      setCoverStatus('error')
      setCoverError(getApiErrorMessage(err, 'Failed to upload cover. Please try again.'))
    }
  }

  const handlePortfolioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadPortfolioFile(file, async (dataUrl) => {
      const item = await uploadPortfolioItem(dataUrl, portfolioCaption.trim() || undefined)
      setArtisan((a) => (a ? { ...a, portfolio: [item, ...a.portfolio] } : a))
      setPortfolioCaption('')
    })
    if (portfolioInputRef.current) portfolioInputRef.current.value = ''
  }

  const handleDeletePortfolio = async (item: PortfolioItem) => {
    setDeletingId(item.id)
    setPortfolioError('')
    try {
      await deletePortfolioItem(item.id)
      setArtisan((a) => (a ? { ...a, portfolio: a.portfolio.filter((p) => p.id !== item.id) } : a))
    } catch (err: unknown) {
      setPortfolioStatus('error')
      setPortfolioError(getApiErrorMessage(err, 'Failed to delete photo. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  const coverPreview = pendingCover || artisan?.cover || ''

  const handleVerificationFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVerificationStatus('idle')
    setVerificationError('')
    const message = validateImage(file)
    if (message) {
      setVerificationStatus('error')
      setVerificationError(message)
      if (verificationInputRef.current) verificationInputRef.current.value = ''
      return
    }
    try {
      const dataUrl = await readImageAsDataUrl(file)
      setPendingVerificationDoc(dataUrl)
    } catch {
      setVerificationStatus('error')
      setVerificationError('Could not read the selected document. Please try again.')
    }
  }

  const handleSubmitVerification = async () => {
    if (!pendingVerificationDoc) return
    setVerificationStatus('uploading')
    setVerificationError('')
    try {
      await submitVerificationDocument(pendingVerificationDoc)
      setPendingVerificationDoc('')
      setVerificationStatus('saved')
      if (verificationInputRef.current) verificationInputRef.current.value = ''
      fetchMyArtisanProfile().then(setArtisan).catch(() => undefined)
    } catch (err: unknown) {
      setVerificationStatus('error')
      setVerificationError(getApiErrorMessage(err, 'Failed to submit document. Please try again.'))
    }
  }

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLocationLat(lat)
    setLocationLng(lng)
    if (address) setLocationAddress(address)
    setLocationSaved(false)
  }

  const handleSaveLocation = async () => {
    if (locationLat === null || locationLng === null) {
      setLocationError('Please choose a location on the map first.')
      return
    }
    setSavingLocation(true)
    setLocationError('')
    setLocationSaved(false)
    try {
      await updateProfile({
        address: locationAddress || undefined,
        latitude: locationLat,
        longitude: locationLng,
      })
      setLocationSaved(true)
      fetchMyArtisanProfile().then(setArtisan).catch(() => undefined)
    } catch (err: unknown) {
      setLocationError(getApiErrorMessage(err, 'Failed to save location. Please try again.'))
    } finally {
      setSavingLocation(false)
    }
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage how customers see you and your work</p>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="relative shrink-0">
            <Image
              src={artisan?.avatar || DEFAULT_AVATAR}
              alt={artisan?.name || 'Artisan'}
              width={72}
              height={72}
              className="rounded-2xl object-cover shrink-0"
            />
            <input
              ref={avatarInputRef}
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleAvatarFile}
            />
            <label
              htmlFor="avatar-upload"
              aria-disabled={avatarStatus === 'uploading'}
              aria-label="Change profile picture"
              className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[#047857] text-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
            >
              {avatarStatus === 'uploading' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display text-xl font-bold text-gray-900">{artisan?.name || 'Loading…'}</p>
              {artisan?.verified && <BadgeCheck size={18} className="text-[#047857]" aria-hidden="true" />}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{artisan?.profession}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
              {artisan?.city && <span className="flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{artisan.city}</span>}
              <span className="flex items-center gap-1"><Star size={13} className="text-amber-500" aria-hidden="true" />{artisan ? `${artisan.rating.toFixed(1)} (${artisan.reviews} reviews)` : '—'}</span>
              <span className="font-semibold text-gray-900">{artisan ? formatNGN(artisan.hourlyRate) + '/hr' : ''}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {available ? 'Available for Work' : 'Unavailable'}
          </div>
        </div>
        {avatarStatus === 'saved' && (
          <Alert className="mt-4">Profile picture updated.</Alert>
        )}
        {avatarStatus === 'error' && avatarError && (
          <Alert variant="error" className="mt-4">{avatarError}</Alert>
        )}
      </div>

      {/* Cover photo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Cover Photo</h2>
        {coverPreview ? (
          <Image
            src={coverPreview}
            alt="Profile cover preview"
            width={1200}
            height={400}
            className="w-full h-40 sm:h-52 object-cover rounded-xl mb-4"
          />
        ) : (
          <div className="w-full h-40 sm:h-52 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-600 text-sm mb-4">
            No cover photo yet
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={coverInputRef}
            id="cover-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleCoverFile}
          />
          <label
            htmlFor="cover-upload"
            aria-disabled={coverStatus === 'uploading'}
            className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          >
            <Camera size={15} aria-hidden="true" />
            {pendingCover ? 'Choose a different photo' : 'Choose photo'}
          </label>
          {pendingCover && (
            <button
              type="button"
              onClick={handleUploadCover}
              disabled={coverStatus === 'uploading'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {coverStatus === 'uploading' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
              {coverStatus === 'uploading' ? 'Uploading…' : 'Upload Cover'}
            </button>
          )}
          {pendingCover && (
            <button
              type="button"
              onClick={() => { setPendingCover(''); setCoverStatus('idle'); setCoverError(''); if (coverInputRef.current) coverInputRef.current.value = '' }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP or GIF. Maximum 4MB.</p>
        {coverStatus === 'saved' && (
          <Alert className="mt-3">Cover photo updated.</Alert>
        )}
        {coverStatus === 'error' && coverError && (
          <Alert variant="error" className="mt-3">{coverError}</Alert>
        )}
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="font-semibold text-gray-900">Location</h2>
          <p className="text-xs text-gray-500">Shown on your public profile</p>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Set the address where you work so customers can find you. Search for a place or click the map to drop a pin.
        </p>
        <MapPicker
          lat={locationLat}
          lng={locationLng}
          address={locationAddress}
          onSelect={handleLocationSelect}
          onAddressChange={setLocationAddress}
        />
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={savingLocation}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {savingLocation ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
            {savingLocation ? 'Saving…' : 'Save Location'}
          </button>
          {locationLat !== null && locationLng !== null && (
            <p className="text-xs text-gray-500">{locationLat.toFixed(5)}, {locationLng.toFixed(5)}</p>
          )}
        </div>
        {locationSaved && (
          <Alert className="mt-3">Location saved.</Alert>
        )}
        {locationError && (
          <Alert variant="error" className="mt-3">{locationError}</Alert>
        )}
      </div>

      {/* ID Verification */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900"><ShieldCheck size={18} className="text-[#047857]" aria-hidden="true" /> ID Verification</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            artisan?.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700'
            : artisan?.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-700'
            : artisan?.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600'
          }`}>
            {artisan?.verificationStatus === 'VERIFIED' ? 'Verified'
              : artisan?.verificationStatus === 'PENDING' ? 'Pending review'
              : artisan?.verificationStatus === 'REJECTED' ? 'Rejected'
              : 'Not submitted'}
          </span>
        </div>

        {artisan?.verificationStatus === 'VERIFIED' ? (
          <Alert className="mt-3">
            Your identity has been verified. You carry the verified badge on your public profile.
          </Alert>
        ) : artisan?.verificationStatus === 'PENDING' ? (
          <Alert variant="warning" className="mt-3">
            Your document is being reviewed. We&apos;ll let you know as soon as it&apos;s approved or rejected.
          </Alert>
        ) : (
          <>
            <p className="text-sm text-gray-600 mt-2">
              Upload a government-issued ID (e.g. National ID, Driver&apos;s Licence or International Passport) to unlock the verified badge.
              Only our review team can see it.
            </p>
            {artisan?.verificationStatus === 'REJECTED' && (
              <Alert variant="error" className="mt-3">
                Your previous document was rejected. Please review it and upload a clearer, valid document.
              </Alert>
            )}
            {artisan?.verificationDocUrl && (
              <Image
                src={artisan.verificationDocUrl}
                alt="Previously submitted verification document"
                width={400}
                height={250}
                className="mt-3 max-h-40 w-auto object-cover rounded-xl border border-gray-100"
              />
            )}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <input
                ref={verificationInputRef}
                id="verification-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleVerificationFile}
              />
              <label
                htmlFor="verification-upload"
                aria-disabled={verificationStatus === 'uploading'}
                className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
              >
                <Camera size={15} aria-hidden="true" />
                {pendingVerificationDoc ? 'Choose a different document' : 'Choose document'}
              </label>
              {pendingVerificationDoc && (
                <>
                  <button
                    type="button"
                    onClick={handleSubmitVerification}
                    disabled={verificationStatus === 'uploading'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {verificationStatus === 'uploading' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
                    {verificationStatus === 'uploading' ? 'Submitting…' : 'Submit for review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPendingVerificationDoc(''); setVerificationStatus('idle'); setVerificationError(''); if (verificationInputRef.current) verificationInputRef.current.value = '' }}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP or GIF. Maximum 4MB.</p>
            {verificationStatus === 'saved' && (
              <Alert className="mt-3">Document submitted. It&apos;s now pending review.</Alert>
            )}
            {verificationStatus === 'error' && verificationError && (
              <Alert variant="error" className="mt-3">{verificationError}</Alert>
            )}
          </>
        )}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Edit Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1.5">Profession</label>
            <input
              id="profession"
              value={form.profession}
              onChange={set('profession')}
              placeholder="e.g. Master Plumber"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              id="category"
              value={form.category}
              onChange={set('category')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors text-gray-700"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={set('bio')}
            rows={4}
            placeholder="Tell customers about your experience and services…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors resize-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate (₦)</label>
          <input
            type="number"
            min={0}
            value={form.hourlyRate}
            onChange={set('hourlyRate')}
            placeholder="e.g. 8500"
            className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
          />
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-5">
          <div>
            <p className="text-sm font-medium text-gray-700" id="availability-switch-label">Available for Work</p>
            <p className="text-xs text-gray-500">Customers can only book you when this is on</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={available}
            aria-label="Available for work"
            aria-labelledby="availability-switch-label"
            onClick={() => { setAvailable(!available); setSaved(false) }}
            className={`relative w-11 h-6 rounded-full transition-colors ${available ? 'bg-[#047857]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${available ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">{error}</Alert>
        )}
        {saved && (
          <Alert className="mb-4">Profile updated successfully.</Alert>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Portfolio */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="font-semibold text-gray-900">Portfolio</h2>
          <p className="text-xs text-gray-500">Showcase your best work</p>
        </div>

        {(artisan?.portfolio?.length || 0) > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {artisan!.portfolio.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden bg-gray-100">
                <Image src={item.imageUrl} alt={item.caption || 'Portfolio photo'} width={400} height={300} className="w-full h-32 md:h-36 object-cover" />
                {item.caption && (
                  <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs px-3 py-1.5">{item.caption}</p>
                )}
                <button
                  type="button"
                  onClick={() => handleDeletePortfolio(item)}
                  disabled={deletingId === item.id}
                  aria-label={`Delete portfolio photo${item.caption ? `: ${item.caption}` : ''}`}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deletingId === item.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-2">No portfolio photos yet. Add your first photo below.</p>
        )}

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Add a photo</p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label htmlFor="portfolio-caption" className="block text-xs font-medium text-gray-500 mb-1">Caption (optional)</label>
              <input
                id="portfolio-caption"
                value={portfolioCaption}
                onChange={(e) => { setPortfolioCaption(e.target.value); setPortfolioStatus('idle') }}
                placeholder="e.g. Kitchen repaint in Ikeja"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#047857] transition-colors"
              />
            </div>
            <input
              ref={portfolioInputRef}
              id="portfolio-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handlePortfolioFile}
            />
            <label
              htmlFor="portfolio-upload"
              aria-disabled={portfolioStatus === 'uploading'}
              className="inline-flex items-center gap-2 shrink-0 cursor-pointer text-sm font-medium px-4 py-2.5 rounded-xl bg-[#047857] text-white hover:opacity-90 transition-opacity aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
            >
              {portfolioStatus === 'uploading' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={15} aria-hidden="true" />}
              {portfolioStatus === 'uploading' ? 'Uploading…' : 'Upload Photo'}
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP or GIF. Maximum 4MB.</p>
          {portfolioStatus === 'saved' && (
            <Alert className="mt-3">Photo added to your portfolio.</Alert>
          )}
          {portfolioStatus === 'error' && portfolioError && (
            <Alert variant="error" className="mt-3">{portfolioError}</Alert>
          )}
        </div>
      </div>
    </>
  )
}
