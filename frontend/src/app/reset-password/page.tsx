'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Shield, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { resetPassword } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'
import Brand from '@/components/Brand'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset your password. Please request a new link.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Brand /></div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          {!token ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-amber-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Invalid reset link</h1>
              <p className="text-gray-500 text-sm mb-6">
                This link is missing a reset token. Please request a new password reset link.
              </p>
              <Link href="/forgot-password" className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-[#047857]" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Password updated</h1>
              <p className="text-gray-500 text-sm mb-6">Your password has been reset successfully. You can now log in.</p>
              <Link href="/login" className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity">
                Log in
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#047857] transition-colors mb-6">
                <ArrowLeft size={15} /> Back to login
              </Link>

              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Set a new password</h1>
              <p className="text-gray-500 text-sm mb-6">Choose a strong password you haven&apos;t used before.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#047857] transition-colors">
                    <Shield size={16} className="text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      minLength={8}
                      required
                      className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#047857] transition-colors">
                    <Shield size={16} className="text-gray-400" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      minLength={8}
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
                  {loading ? 'Saving…' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
