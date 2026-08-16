'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Mail, ArrowLeft, Loader2, ShieldCheck, RotateCcw } from 'lucide-react'
import Brand from '@/components/Brand'
import { requestEmailVerification, confirmEmailVerification } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramEmail = searchParams.get('email') || ''
  const paramRole = searchParams.get('role') as 'CUSTOMER' | 'ARTISAN' | null

  const [email, setEmail] = useState(paramEmail)
  const [sent, setSent] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !email) return
    started.current = true
    sendCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const sendCode = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await requestEmailVerification(email)
      setSent(true)
      setDevCode(res.devCode || '')
      setCountdown(60)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the verification code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resending) return
    setResending(true)
    setError('')
    try {
      const res = await requestEmailVerification(email)
      setCode('')
      setDevCode(res.devCode || '')
      setCountdown(60)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not resend the code. Please try again.'))
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code from the email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await confirmEmailVerification(email, code)
      router.push(user.role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Brand /></div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <Link href={paramRole === 'ARTISAN' ? '/register' : '/login'} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#047857] transition-colors mb-6">
            <ArrowLeft size={15} /> {paramRole === 'ARTISAN' ? 'Back to registration' : 'Back to login'}
          </Link>

          {!sent ? (
            <>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter the email you used to create your NaijaHandy account and we&apos;ll send you a 6-digit code.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); sendCode() }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#047857] transition-colors">
                    <Mail size={16} className="text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {error && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                  {loading ? 'Sending…' : 'Send verification code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-[#047857]" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
                Enter it below to activate your account. The code expires in 10 minutes.
              </p>

              {devCode && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3 mb-4">
                  Dev mode: emails are disabled, so your code is <span className="font-mono font-bold tracking-widest">{devCode}</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    required
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-semibold tracking-[0.4em] text-gray-900 outline-none focus:border-[#047857] transition-colors"
                  />
                </div>

                {error && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                  {loading ? 'Verifying…' : 'Verify & continue'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Didn&apos;t get it?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="font-semibold text-[#047857] hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
                >
                  <RotateCcw size={13} />
                  {resending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] bg-gray-50" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
