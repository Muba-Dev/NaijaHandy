'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, LifeBuoy, Mail, Phone, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react'
import { createSupportMessage } from '@/lib/api'
import { getStoredUser, getApiErrorMessage } from '@/lib/utils'
import type { AuthUser, HelpArticleGroup } from '@/types'

function FaqAccordion({ section }: { section: HelpArticleGroup }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <h2 className="px-5 pt-5 pb-3 font-semibold text-gray-900 text-sm uppercase tracking-wider">{section.category}</h2>
      <div className="divide-y divide-gray-50">
        {section.items.map((item) => {
          const isOpen = open === item.slug
          return (
            <div key={item.slug} id={item.slug} className="scroll-mt-24">
              <button
                onClick={() => setOpen(isOpen ? null : item.slug)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800">{item.title}</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.content}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HelpContent({ sections }: { sections: HelpArticleGroup[] }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const u = getStoredUser<AuthUser>()
    setUser(u)
    if (u) setForm((f) => ({ ...f, name: f.name || u.name, email: f.email || u.email, phone: f.phone || u.phone || '' }))
  }, [])

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const canSubmit =
    form.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
    form.subject.trim().length >= 3 &&
    form.message.trim().length >= 10

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createSupportMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSent(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send your message. Please try again.'))
    }
    setSubmitting(false)
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#047857] placeholder-gray-400'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">How can we help?</h1>
          <p className="text-gray-500 mt-2">
            Find quick answers below, or send us a message and the NaijaHandy team will get back to you.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQs */}
          <div className="lg:col-span-2 space-y-6">
            {sections.length === 0 ? (
              <p className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-sm text-gray-500" role="status">
                Help articles are not available right now. Please use the contact form.
              </p>
            ) : (
              sections.map((section) => <FaqAccordion key={section.category} section={section} />)
            )}
          </div>

          {/* Contact */}
          <div className="space-y-6 lg:sticky lg:top-24 self-start" id="contact">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                <LifeBuoy size={18} className="text-[#047857]" aria-hidden="true" />
                Still need help?
              </h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">Send us a message and we&apos;ll reply as soon as we can.</p>

              {sent ? (
                <div className="flex items-center gap-2 text-sm font-medium text-[#047857] bg-emerald-50 rounded-xl px-4 py-3">
                  <CheckCircle2 size={16} aria-hidden="true" /> Message sent — we&apos;ll be in touch soon.
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="help-name" className={labelClass}>Name</label>
                    <input id="help-name" value={form.name} onChange={update('name')} placeholder="Your full name" className={inputClass} required />
                  </div>
                  <div>
                    <label htmlFor="help-email" className={labelClass}>Email</label>
                    <input id="help-email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className={inputClass} required />
                  </div>
                  <div>
                    <label htmlFor="help-phone" className={labelClass}>Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input id="help-phone" value={form.phone} onChange={update('phone')} placeholder="080…" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="help-subject" className={labelClass}>Subject</label>
                    <select id="help-subject" value={form.subject} onChange={update('subject')} className={inputClass}>
                      <option value="">Choose a topic…</option>
                      <option>Booking or payment issue</option>
                      <option>Refund or cancellation</option>
                      <option>Verification or account</option>
                      <option>Dispute</option>
                      <option>Something else</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="help-message" className={labelClass}>Message</label>
                    <textarea id="help-message" rows={4} value={form.message} onChange={update('message')} placeholder="Tell us what happened…" className={inputClass} required />
                  </div>
                  {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#047857] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <MessageSquare size={15} aria-hidden="true" />}
                    Send message
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900 text-sm">Other ways to reach us</h2>
              <a href={`mailto:support@naijahandy.com?subject=${encodeURIComponent('NaijaHandy help request')}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#047857]">
                <Mail size={15} className="text-gray-400" aria-hidden="true" /> support@naijahandy.com
              </a>
              {user && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone size={15} className="text-gray-400" aria-hidden="true" /> We reply to {user.name.split(' ')[0]}&apos;s account email.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
