'use client'

import { useCallback, useState } from 'react'
import { compressImage, readImageAsDataUrl, getApiErrorMessage } from '@/lib/utils'

export type UseImageUploadOptions = {
  /** 'compress' downsizes to a JPEG data URL (default); 'raw' keeps the original image bytes. */
  pipeline?: 'compress' | 'raw'
  /** Returns an error message to reject the file, or null to accept it. */
  validate?: (file: File) => string | null
  /** Message shown when an unexpected error occurs while reading/uploading. */
  fallbackError?: string
}

export default function useImageUpload({
  pipeline = 'compress',
  validate,
  fallbackError = 'Failed to upload the file. Please try again.',
}: UseImageUploadOptions = {}) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const busy = status === 'uploading'

  const handleFile = useCallback(
    async (file: File | undefined, submit: (dataUrl: string) => Promise<unknown> | void) => {
      if (!file) return
      const invalid = validate?.(file)
      if (invalid) {
        setError(invalid)
        setStatus('error')
        return
      }
      setError('')
      setStatus('uploading')
      try {
        const dataUrl = pipeline === 'raw' ? await readImageAsDataUrl(file) : await compressImage(file)
        await submit(dataUrl)
        setStatus('saved')
      } catch (err) {
        setError(getApiErrorMessage(err, fallbackError))
        setStatus('error')
      }
    },
    [pipeline, validate, fallbackError],
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setError('')
  }, [])

  return { status, error, busy, handleFile, reset, setStatus, setError }
}