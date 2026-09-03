import { useRef } from 'react'
import Image from 'next/image'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { DEFAULT_AVATAR } from '@/lib/data'
import type { AuthUser } from '@/types'

interface Props {
  user: AuthUser | null
  name: string
  onNameChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  city: string
  onCityChange: (v: string) => void
  saving: boolean
  saved: boolean
  error: string
  onSubmit: (e: React.FormEvent) => void
  uploading: boolean
  uploadError: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function PersonalInfoTab({
  user,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  city,
  onCityChange,
  saving,
  saved,
  error,
  onSubmit,
  uploading,
  uploadError,
  onFileChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <form onSubmit={onSubmit}>
      <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>
      <div className="flex items-center gap-4 mb-6">
        <Image
          src={user?.avatar || DEFAULT_AVATAR}
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
            onChange={onFileChange}
          />
          <label
            htmlFor="photo-upload"
            className="inline-block cursor-pointer text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            aria-disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Change Photo'}
          </label>
          <p className="text-xs text-gray-500 mt-1.5">JPG, PNG or WebP — auto-resized to upload fast</p>
          {uploadError && <p className="text-xs text-red-600 mt-1.5" role="alert">{uploadError}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            id="full-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
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
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
          <input
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
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
  )
}
