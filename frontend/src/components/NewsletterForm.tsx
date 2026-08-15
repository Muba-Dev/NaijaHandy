'use client'

import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'

export default function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubscribed(true)
    e.currentTarget.reset()
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        placeholder="you@email.com"
        required
        className="flex-1 rounded-xl bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Subscribe to newsletter"
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/40 transition-all hover:from-emerald-500 hover:to-teal-400"
      >
        {subscribed ? <CheckCircle2 size={14} aria-hidden="true" /> : <Send size={14} aria-hidden="true" />} Subscribe
      </button>
    </form>
  )
}
