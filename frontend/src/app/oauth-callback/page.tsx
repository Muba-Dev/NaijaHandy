'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { fetchMe } from '@/lib/api'
import { setAuthTokens, setStoredUser } from '@/lib/utils'
import Brand from '@/components/Brand'

function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const role = searchParams.get('role')
    const errorMsg = searchParams.get('error')
    const redirect = searchParams.get('redirect')

    if (errorMsg) {
      setError(errorMsg)
      return
    }

    if (!accessToken || !refreshToken || !role) {
      setError('Invalid sign-in response. Please try again.')
      return
    }

    setAuthTokens(accessToken, refreshToken)
    ;(async () => {
      try {
        const user = await fetchMe()
        setStoredUser(user)
      } catch {
        setStoredUser({ role: role as 'CUSTOMER' | 'ARTISAN' })
      }
      const target =
        redirect && redirect.startsWith('/') && !redirect.startsWith('/oauth-callback')
          ? redirect
          : role === 'ARTISAN'
            ? '/dashboard/artisan'
            : '/dashboard/customer'
      router.replace(target)
    })()
  }, [router, searchParams])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Brand /></div>

        {error ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-600" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-gray-900 mb-1">Sign-in failed</h1>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={22} className="text-[#047857] animate-spin" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-gray-900 mb-1">Signing you in…</h1>
            <p className="text-sm text-gray-500">One moment, we&apos;re setting up your dashboard.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <OAuthCallback />
    </Suspense>
  )
}
