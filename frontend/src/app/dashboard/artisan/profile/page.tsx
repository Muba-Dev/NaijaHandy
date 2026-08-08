'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BadgeCheck, MapPin, Star, Save, Loader2 } from 'lucide-react'
import { fetchMyArtisanProfile, updateArtisanProfile } from '@/lib/api'
import { formatNGN, getApiErrorMessage } from '@/lib/utils'
import { CATEGORIES } from '@/lib/data'
import type { Artisan } from '@/types'

export default function MyProfilePage() {
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [form, setForm] = useState({ profession: '', category: '', bio: '', hourlyRate: '', coverImage: '' })
  const [available, setAvailable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyArtisanProfile().then((p) => {
      setArtisan(p)
      setForm({
        profession: p.profession,
        category: p.category,
        bio: p.bio,
        hourlyRate: String(p.hourlyRate || ''),
        coverImage: p.cover || '',
      })
      setAvailable(p.available)
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
        coverImage: form.coverImage || undefined,
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

  return (
    <>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage how customers see you and your work</p>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <Image
            src={artisan?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&auto=format'}
            alt={artisan?.name || 'Artisan'}
            width={72}
            height={72}
            className="rounded-2xl object-cover shrink-0"
          />
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
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Edit Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Profession</label>
            <input
              value={form.profession}
              onChange={set('profession')}
              placeholder="e.g. Master Plumber"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate (₦)</label>
            <input
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={set('hourlyRate')}
              placeholder="e.g. 8500"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image URL</label>
            <input
              value={form.coverImage}
              onChange={set('coverImage')}
              placeholder="https://…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>
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
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}
        {saved && (
          <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4">Profile updated successfully.</div>
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
    </>
  )
}
