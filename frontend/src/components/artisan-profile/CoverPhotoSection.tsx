import Image from 'next/image'
import { Save, Loader2, Camera } from 'lucide-react'
import Alert from '@/components/ui/Alert'

interface CoverPhotoSectionProps {
  coverPreview: string
  pendingCover: string
  coverStatus: 'idle' | 'uploading' | 'saved' | 'error'
  coverError: string
  coverInputRef: React.RefObject<HTMLInputElement | null>
  onCoverFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUploadCover: () => void
  onCancelCover: () => void
}

export default function CoverPhotoSection({ coverPreview, pendingCover, coverStatus, coverError, coverInputRef, onCoverFile, onUploadCover, onCancelCover }: CoverPhotoSectionProps) {
  return (
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
          onChange={onCoverFile}
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
            onClick={onUploadCover}
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
            onClick={onCancelCover}
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
  )
}
