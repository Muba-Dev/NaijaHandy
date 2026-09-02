import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Clock, XCircle, Phone, MessageSquare, Heart, Zap, ShieldCheck, Check, ArrowLeft,
} from 'lucide-react'
import StarRating from '@/components/StarRating'
import { DEFAULT_AVATAR } from '@/lib/data'
import { isWhatsAppPhone, buildWhatsAppLink } from '@/lib/utils'
import type { Artisan } from '@/types'

interface Props {
  artisan: Artisan
  saved: boolean
  saving: boolean
  onToggleSave: () => void
}

export default function ProfileHeader({ artisan, saved, saving, onToggleSave }: Props) {
  const actionBtn =
    'inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#047857] hover:text-[#047857] hover:bg-emerald-50/50'
  const whatsappLink = buildWhatsAppLink(artisan.phone, `Hello ${artisan.name}! I found you on NaijaHandy and I have a question about your ${artisan.profession} service before I book.`)

  return (
    <>
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
                onClick={onToggleSave}
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
    </>
  )
}