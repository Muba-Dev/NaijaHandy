'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchMyArtisanProfile, updateArtisanProfile, updateArtisanCover, uploadPortfolioItem, deletePortfolioItem, updateProfile, submitVerificationDocument, updateAvatar } from '@/lib/api'
import { getApiErrorMessage, readImageAsDataUrl, setStoredUser } from '@/lib/utils'
import ProfileHeader from '@/components/artisan-profile/ProfileHeader'
import CoverPhotoSection from '@/components/artisan-profile/CoverPhotoSection'
import LocationSection from '@/components/artisan-profile/LocationSection'
import VerificationSection from '@/components/artisan-profile/VerificationSection'
import EditProfileForm from '@/components/artisan-profile/EditProfileForm'
import PortfolioSection from '@/components/artisan-profile/PortfolioSection'
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

  const handleCancelCover = () => {
    setPendingCover('')
    setCoverStatus('idle')
    setCoverError('')
    if (coverInputRef.current) coverInputRef.current.value = ''
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

  const handleCancelVerification = () => {
    setPendingVerificationDoc('')
    setVerificationStatus('idle')
    setVerificationError('')
    if (verificationInputRef.current) verificationInputRef.current.value = ''
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

      <ProfileHeader
        artisan={artisan}
        available={available}
        avatarStatus={avatarStatus}
        avatarError={avatarError}
        avatarInputRef={avatarInputRef}
        onAvatarFile={handleAvatarFile}
      />

      <CoverPhotoSection
        coverPreview={coverPreview}
        pendingCover={pendingCover}
        coverStatus={coverStatus}
        coverError={coverError}
        coverInputRef={coverInputRef}
        onCoverFile={handleCoverFile}
        onUploadCover={handleUploadCover}
        onCancelCover={handleCancelCover}
      />

      <LocationSection
        locationLat={locationLat}
        locationLng={locationLng}
        locationAddress={locationAddress}
        onLocationSelect={handleLocationSelect}
        onAddressChange={setLocationAddress}
        onSaveLocation={handleSaveLocation}
        savingLocation={savingLocation}
        locationSaved={locationSaved}
        locationError={locationError}
      />

      <VerificationSection
        artisan={artisan}
        pendingVerificationDoc={pendingVerificationDoc}
        verificationStatus={verificationStatus}
        verificationError={verificationError}
        verificationInputRef={verificationInputRef}
        onVerificationFile={handleVerificationFile}
        onSubmitVerification={handleSubmitVerification}
        onCancelVerification={handleCancelVerification}
      />

      <EditProfileForm
        form={form}
        set={set}
        available={available}
        onToggleAvailable={() => { setAvailable(!available); setSaved(false) }}
        onSubmit={handleSave}
        saving={saving}
        saved={saved}
        error={error}
      />

      <PortfolioSection
        portfolio={artisan?.portfolio || []}
        portfolioCaption={portfolioCaption}
        portfolioStatus={portfolioStatus}
        portfolioError={portfolioError}
        portfolioInputRef={portfolioInputRef}
        deletingId={deletingId}
        onCaptionChange={(value) => { setPortfolioCaption(value); setPortfolioStatus('idle') }}
        onPortfolioFile={handlePortfolioFile}
        onDeletePortfolio={handleDeletePortfolio}
      />
    </>
  )
}
