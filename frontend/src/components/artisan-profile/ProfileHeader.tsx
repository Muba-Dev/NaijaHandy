import Image from 'next/image'
import { BadgeCheck, MapPin, Star, Loader2, Camera } from 'lucide-react'
import { formatNGN } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import Alert from '@/components/ui/Alert'
import type { Artisan } from '@/types'

interface ProfileHeaderProps {
  artisan: Artisan | null
  available: boolean
  avatarStatus: string
  avatarError: string
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarFile: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ProfileHeader({ artisan, available, avatarStatus, avatarError, avatarInputRef, onAvatarFile }: ProfileHeaderProps) {
  return (
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
            onChange={onAvatarFile}
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
  )
}
