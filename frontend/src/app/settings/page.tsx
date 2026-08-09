'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Users, Shield, CreditCard, Bell, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import BackToDashboard from '@/components/BackToDashboard'
import { fetchMe, updateProfile, updateAvatar, changePassword } from '@/lib/api'
import { setStoredUser, getApiErrorMessage } from '@/lib/utils'
import type { AuthUser } from '@/types'

type SettingsTab = 'personal' | 'security' | 'payment' | 'notifications'

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    fetchMe().then((u) => {
      setUser(u)
      setName(u.name)
      setPhone(u.phone || '')
      setCity(u.city || '')
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image is too large. Maximum size is 2MB.')
      return
    }
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Could not read the file'))
        reader.readAsDataURL(file)
      })
      const updated = await updateAvatar(dataUrl)
      setUser((u) => (u ? { ...u, avatar: updated.avatar } : u))
      setStoredUser(updated)
    } catch (err) {
      setUploadError(getApiErrorMessage(err, 'Failed to upload your photo. Please try again.'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <BackToDashboard href="/dashboard/customer" />
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-7">Profile Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tab sidebar */}
          <div className="w-full md:w-48 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-2 space-y-1">
              {tabs.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    aria-pressed={activeTab === t.id}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon size={15} aria-hidden="true" />{t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content panel */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">
            {activeTab === 'personal' && (
              <form onSubmit={handleSave}>
                <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <Image
                    src={user?.avatar || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format'}
                    alt={user?.name || 'user'}
                    width={64}
                    height={64}
                    className="rounded-2xl object-cover"
                  />
                  <div>
                    <input
                      ref={fileInputRef}
                      id="photo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-block cursor-pointer text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                      aria-disabled={uploading}
                    >
                      {uploading ? 'Uploading…' : 'Change Photo'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1.5">JPG, PNG, WebP up to 2MB</p>
                    {uploadError && <p className="text-xs text-red-600 mt-1.5" role="alert">{uploadError}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      id="full-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lagos"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
                    />
                  </div>
                </div>

                {saved && (
                  <div role="status" className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle2 size={16} aria-hidden="true" /> Your changes have been saved.
                  </div>
                )}
                {error && (
                  <div role="alert" className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle size={16} aria-hidden="true" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !user}
                  className="mt-5 px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-5">Security & Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                  {[
                    { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, key: 'current' },
                    { label: 'New Password', value: newPassword, setter: setNewPassword, key: 'new' },
                    { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, key: 'confirm' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`password-${f.key}`} className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <input
                        id={`password-${f.key}`}
                        type="password"
                        value={f.value}
                        onChange={(e) => f.setter(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
                      />
                    </div>
                  ))}
                  {passwordMessage && (
                    passwordMessage === 'updated' ? (
                      <div role="status" className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                        <CheckCircle2 size={16} aria-hidden="true" /> Password updated. You may need to log in again on other devices.
                      </div>
                    ) : (
                      <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                        <AlertCircle size={16} aria-hidden="true" /> {passwordMessage}
                      </div>
                    )
                  )}
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {changingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'payment' && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-5">Payment Methods</h2>
                <div className="space-y-3 mb-5">
                  {[
                    { type: 'Bank Transfer', detail: 'Zenith Bank — 2031 456 789', primary: true },
                    { type: 'Card', detail: 'Mastercard •••• 4421', primary: false },
                  ].map((m) => (
                    <div key={m.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <CreditCard size={20} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{m.type}</p>
                          <p className="text-xs text-gray-500">{m.detail}</p>
                        </div>
                      </div>
                      {m.primary && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-[#047857] hover:text-[#047857] transition-colors">
                  <Plus size={16} /> Add Payment Method
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-5">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Booking Confirmations', sub: 'Get notified when a booking is confirmed', default: true },
                    { label: 'Job Reminders', sub: '24-hour reminder before scheduled jobs', default: true },
                    { label: 'New Messages', sub: 'Receive alerts for new messages from artisans', default: true },
                    { label: 'Promotions & Offers', sub: 'Deals and platform news', default: false },
                    { label: 'SMS Alerts', sub: 'Text messages for critical updates', default: false },
                  ].map((n, idx) => (
                    <label
                      key={n.label}
                      htmlFor={`notif-${idx}`}
                      className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{n.label}</p>
                        <p className="text-xs text-gray-500">{n.sub}</p>
                      </div>
                      <input id={`notif-${idx}`} type="checkbox" defaultChecked={n.default} className="w-5 h-5 accent-emerald-600" />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
