'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { forgotPassword } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'
import Brand from '@/components/Brand'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Brand /></div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#047857] transition-colors mb-6">
            <ArrowLeft size={15} /> Back to login
          </Link>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-[#047857]" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                If an account exists for <span className="font-medium text-gray-700">{email}</span>, a
                password reset link has been sent. The link expires in 60 minutes.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm font-semibold text-[#047857] hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-[#047857] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
