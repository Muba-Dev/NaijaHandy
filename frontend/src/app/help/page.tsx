'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, LifeBuoy, Mail, Phone, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react'
import { createSupportMessage } from '@/lib/api'
import { getStoredUser, getApiErrorMessage } from '@/lib/utils'
import type { AuthUser } from '@/types'

type Faq = { q: string; a: string }
type FaqSection = { title: string; items: Faq[] }

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'How do I book an artisan?',
        a: 'Search or browse for an artisan, open their profile, choose a date and time, and describe the job. Use "Send Instant Request" to ask them to get in touch for free, or "Proceed to Book & Pay" to see a price estimate and pay securely through Paystack.',
      },
      {
        q: 'Do I need an account to book?',
        a: 'Yes. Registering lets you send booking requests, pay, save artisans, and rebook later. Your phone number and job address are saved so booking again is one tap.',
      },
      {
        q: 'What is the difference between "Send Instant Request" and "Proceed to Book & Pay"?',
        a: 'An instant request is free — it notifies the artisan with your contact details so they can reach you. "Proceed to Book & Pay" shows a price estimate and takes you through checkout; your booking is confirmed once payment succeeds.',
      },
    ],
  },
  {
    title: 'Booking & payments',
    items: [
      {
        q: 'How do payments work?',
        a: 'Checkout is handled by Paystack. You can pay with card, bank transfer, or USSD. Your booking is confirmed once the payment succeeds, and both you and the artisan get a notification.',
      },
      {
        q: 'Why is there a platform fee?',
        a: 'The price estimate shows the artisan\u2019s rate plus a small platform fee. The fee keeps NaijaHandy running — matching, verification, and support.',
      },
      {
        q: 'Can I cancel a booking?',
        a: 'Yes — open your booking from the Bookings page and cancel it. If you already paid, contact us through this page and we\u2019ll help you sort out a refund.',
      },
      {
        q: 'Will I be charged for an instant request?',
        a: 'No. Instant requests are free; you only pay when you complete checkout for a booking.',
      },
    ],
  },
  {
    title: 'Trust & safety',
    items: [
      {
        q: 'How do I know an artisan is verified?',
        a: 'Artisans who pass ID verification carry a verified badge on their profile. You can also read reviews and check each profile\u2019s completed-job history.',
      },
      {
        q: 'Are reviews moderated?',
        a: 'Yes. Reviews are checked and hidden if they break our guidelines, so what you see reflects real completed work.',
      },
    ],
  },
  {
    title: 'Disputes & guarantee',
    items: [
      {
        q: 'What if something goes wrong with a job?',
        a: 'From your booking you can raise a dispute and our team will review it. A formal NaijaHandy service guarantee is on the way.',
      },
    ],
  },
  {
    title: 'For artisans',
    items: [
      {
        q: 'How do I receive booking requests?',
        a: 'New requests appear in your artisan dashboard where you can accept or decline them. You\u2019ll also be notified by email and in-app.',
      },
      {
        q: 'How do I get the verified badge?',
        a: 'Submit an ID document from your artisan profile. Our team reviews it, and once approved you\u2019ll carry the verified badge on your profile.',
      },
    ],
  },
]

function FaqAccordion({ section }: { section: FaqSection }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <h2 className="px-5 pt-5 pb-3 font-semibold text-gray-900 text-sm uppercase tracking-wider">{section.title}</h2>
      <div className="divide-y divide-gray-50">
        {section.items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800">{item.q}</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HelpPage() {
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
            {FAQ_SECTIONS.map((section) => (
              <FaqAccordion key={section.title} section={section} />
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
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
