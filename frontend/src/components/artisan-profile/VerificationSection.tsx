import Image from 'next/image'
import { ShieldCheck, Camera, Upload, Loader2 } from 'lucide-react'
import Alert from '@/components/ui/Alert'
import type { Artisan } from '@/types'

interface VerificationSectionProps {
  artisan: Artisan | null
  pendingVerificationDoc: string
  verificationStatus: 'idle' | 'uploading' | 'saved' | 'error'
  verificationError: string
  verificationInputRef: React.RefObject<HTMLInputElement | null>
  onVerificationFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmitVerification: () => void
  onCancelVerification: () => void
}

export default function VerificationSection({ artisan, pendingVerificationDoc, verificationStatus, verificationError, verificationInputRef, onVerificationFile, onSubmitVerification, onCancelVerification }: VerificationSectionProps) {
  return (
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
              onChange={onVerificationFile}
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
                  onClick={onSubmitVerification}
                  disabled={verificationStatus === 'uploading'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {verificationStatus === 'uploading' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
                  {verificationStatus === 'uploading' ? 'Submitting…' : 'Submit for review'}
                </button>
                <button
                  type="button"
                  onClick={onCancelVerification}
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
  )
}
