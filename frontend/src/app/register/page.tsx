'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Brand from '@/components/Brand'
import { CATEGORIES, NIGERIAN_CITIES } from '@/lib/data'
import { register } from '@/lib/api'
import { getStoredUser, getApiErrorMessage } from '@/lib/utils'

type Role = 'CUSTOMER' | 'ARTISAN'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('CUSTOMER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', password: '', profession: '',
  })

  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      router.replace(user.role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer')
    }
  }, [router])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password,
        role,
        profession: role === 'ARTISAN' ? form.profession : undefined,
        category: role === 'ARTISAN' ? form.profession : undefined,
      })
      router.push(role === 'ARTISAN' ? '/dashboard/artisan' : '/dashboard/customer')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8 md:p-10">
        <div className="mb-7">
          <Brand />
        </div>

        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 mb-6">Join thousands of Nigerians using NaijaHandy.</p>

        {/* Role toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6" role="group" aria-label="Account type">
          {(['CUSTOMER', 'ARTISAN'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${role === r ? 'bg-white shadow text-gray-900' : 'text-gray-700'}`}
            >
              {r === 'CUSTOMER' ? '👤 Customer' : '🔧 Artisan'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                id="name"
                value={form.name}
                onChange={set('name')}
                placeholder="Amaka Okonkwo"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                id="phone"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+234 801 234 5678"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">City / State</label>
            <select
              id="city"
              value={form.city}
              onChange={set('city')}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors text-gray-700"
            >
              <option value="">Select your city</option>
              {NIGERIAN_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {role === 'ARTISAN' && (
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1.5">Profession / Skill</label>
              <select
                id="profession"
                value={form.profession}
                onChange={set('profession')}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors text-gray-700"
              >
                <option value="">Select your profession</option>
                {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                minLength={8}
                required
                className="w-full border border-gray-200 rounded-xl px-4 pr-11 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
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
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating account…' : `Create ${role === 'ARTISAN' ? 'Artisan' : 'Customer'} Account`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#047857] hover:underline">Log in</Link>
        </p>
        <p className="text-center text-xs text-gray-500 mt-3">
          By registering, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
