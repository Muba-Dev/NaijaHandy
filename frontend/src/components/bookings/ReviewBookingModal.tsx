import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Star, X, Camera } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { readImageAsDataUrl } from '@/lib/utils'
import type { Booking } from '@/types'

interface Props {
  booking: Booking
  submitting: boolean
  onSubmit: (rating: number, comment: string, photoUrl: string) => void
  onClose: () => void
}

export default function ReviewBookingModal({ booking, submitting, onSubmit, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photo, setPhoto] = useState('')
  const [error, setError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRating(0)
    setComment('')
    setPhoto('')
    setError('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }, [booking.id])

  return (
    <Modal title="Review your booking" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        How was your experience with{' '}
        <span className="font-semibold text-gray-900">{booking.artisan}</span>?
      </p>

      <div className="flex items-center gap-1 mb-4" role="group" aria-label="Rate your experience">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-2 -m-1"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-pressed={star <= rating}
          >
            <Star
              size={26}
              className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              aria-hidden="true"
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500">{rating ? `${rating}/5` : 'Tap to rate'}</span>
      </div>

      <label htmlFor="review-comment" className="sr-only">Share your experience</label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Share your experience (min 3 characters)..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#047857] transition-colors resize-none mb-3"
      />

      {photo && (
        <div className="relative inline-block mb-3">
          <Image src={photo} alt="Review photo preview" width={200} height={150} className="h-28 w-40 object-cover rounded-xl border border-gray-100" />
          <button
            type="button"
            onClick={() => { setPhoto(''); if (photoInputRef.current) photoInputRef.current.value = '' }}
            aria-label="Remove review photo"
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-gray-900 text-white hover:bg-red-600 transition-colors"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="mb-3">
        <input
          ref={photoInputRef}
          id="review-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setError('')
            try {
              setPhoto(await readImageAsDataUrl(file))
            } catch {
              setError('Could not read the selected photo. Please try again.')
            }
          }}
        />
        <label htmlFor="review-photo" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
          <Camera size={14} aria-hidden="true" />
          {photo ? 'Change photo (optional)' : 'Add a photo (optional)'}
        </label>
      </div>
      {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(rating, comment, photo)}
          disabled={submitting || rating === 0 || comment.trim().length < 3}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </Modal>
  )
}