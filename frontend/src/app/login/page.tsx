'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, Shield, Wrench } from 'lucide-react'
import { login } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login({ email, password })
      router.push(user.role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative" style={{ background: 'linear-gradient(160deg, #022c22 0%, #047857 100%)' }}>
        <Image
          src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=700&h=900&fit=crop&auto=format"
          alt="artisan at work"
          fill
          className="object-cover opacity-20"
        />
        <div className="relative p-12 flex flex-col justify-end">
          <blockquote className="text-white">
            <p className="font-display text-2xl font-semibold leading-relaxed mb-4">
              &quot;ArtisanNG connected me with a plumber who showed up in 45 minutes. Absolute lifesaver.&quot;
            </p>
            <footer className="flex items-center gap-3">
              <Image
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=48&h=48&fit=crop&auto=format"
                alt="Chisom Eze"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div>
                <p className="text-white font-medium text-sm">Chisom Eze</p>
                <p className="text-emerald-300 text-xs">Lagos, Nigeria</p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#047857]">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold text-gray-900">ArtisanNG</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-8">Log in to manage your bookings and artisans.</p>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#047857] transition-colors">
                <Shield size={16} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-[#047857] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>

            <button
              type="button"
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#047857] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
