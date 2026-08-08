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
        className="flex-1 bg-gray-800 text-sm text-white placeholder-gray-400 rounded-lg px-3 py-2 border border-gray-700 focus:border-[#047857]"
      />
      <button
        type="submit"
        aria-label="Subscribe to newsletter"
        className="px-4 py-2 rounded-lg text-white font-semibold text-sm bg-[#047857] hover:opacity-90 flex items-center gap-1.5"
      >
        {subscribed ? <CheckCircle2 size={14} aria-hidden="true" /> : <Send size={14} aria-hidden="true" />} Go
      </button>
    </form>
  )
}
