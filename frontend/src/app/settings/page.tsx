'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import BackToDashboard from '@/components/BackToDashboard'
import SettingsTabNav from '@/components/settings/SettingsTabNav'
import TabContent from '@/components/settings/TabContent'
import { fetchMe, updateProfile, updateAvatar, changePassword } from '@/lib/api'
import { setStoredUser, getApiErrorMessage } from '@/lib/utils'
import useImageUpload from '@/hooks/useImageUpload'
import type { AuthUser } from '@/types'

type SettingsTab = 'personal' | 'security' | 'payment' | 'notifications'

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankSaving, setBankSaving] = useState(false)
  const [bankSaved, setBankSaved] = useState(false)
  const [bankError, setBankError] = useState('')

  useEffect(() => {
    fetchMe().then((u) => {
      setUser(u)
      setName(u.name)
      setPhone(u.phone || '')
      setCity(u.city || '')
      setBankName(u.bankName || '')
      setBankAccountNumber(u.bankAccountNumber || '')
      setBankAccountName(u.bankAccountName || '')
    }).catch(() => setError('Could not load your profile. Please refresh.'))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const updated = await updateProfile({ name, phone, city })
      setUser((u) => (u ? { ...u, ...updated } : u))
      setStoredUser(updated)
      setSaved(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save changes. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const { busy: uploading, error: uploadError, handleFile } = useImageUpload({
    validate: (file) => {
      if (!file.type.startsWith('image/')) return 'Please choose an image file (JPG, PNG or WebP).'
      if (file.size > 15 * 1024 * 1024) return 'Image is too large. Please choose a photo under 15MB.'
      return null
    },
    fallbackError: 'Failed to upload your photo. Please try again.',
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFile(file, async (dataUrl) => {
      const updated = await updateAvatar(dataUrl)
      setUser((u) => (u ? { ...u, avatar: updated.avatar } : u))
      setStoredUser(updated)
    })
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage('')
    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMessage('updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMessage(getApiErrorMessage(err, 'Failed to update password.'))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBankSaving(true)
    setBankSaved(false)
    setBankError('')
    try {
      const updated = await updateProfile({ bankName, bankAccountNumber, bankAccountName })
      setUser((u) => (u ? { ...u, ...updated } : u))
      setStoredUser(updated)
      setBankSaved(true)
    } catch (err) {
      setBankError(getApiErrorMessage(err, 'Failed to save bank details.'))
    } finally {
      setBankSaving(false)
    }
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <BackToDashboard href="/dashboard/customer" />
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-7">Profile Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          <SettingsTabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <TabContent
            activeTab={activeTab}
            user={user}
            name={name}
            onNameChange={setName}
            phone={phone}
            onPhoneChange={setPhone}
            city={city}
            onCityChange={setCity}
            saving={saving}
            saved={saved}
            error={error}
            onProfileSubmit={handleSave}
            uploading={uploading}
            uploadError={uploadError}
            onFileChange={handleFileChange}
            currentPassword={currentPassword}
            onCurrentPasswordChange={setCurrentPassword}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            changingPassword={changingPassword}
            passwordMessage={passwordMessage}
            onPasswordSubmit={handlePasswordChange}
            bankName={bankName}
            onBankNameChange={setBankName}
            bankAccountNumber={bankAccountNumber}
            onBankAccountNumberChange={setBankAccountNumber}
            bankAccountName={bankAccountName}
            onBankAccountNameChange={setBankAccountName}
            bankSaving={bankSaving}
            bankSaved={bankSaved}
            bankError={bankError}
            onBankSubmit={handleBankSubmit}
          />
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
