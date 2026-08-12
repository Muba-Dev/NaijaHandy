'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2, ExternalLink, LifeBuoy, CheckCircle2 } from 'lucide-react'
import { sendChatMessage, escalateChat } from '@/lib/api'
import { getStoredUser, getApiErrorMessage } from '@/lib/utils'
import type { AuthUser, ChatAction, ChatSource, ChatTranscriptItem } from '@/types'

type UiMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  sources?: ChatSource[]
  actions?: ChatAction[]
  typing?: boolean
}

const ACTION_HREFS: Record<ChatAction['action'], string> = {
  bookings: '/bookings',
  dispute: '/bookings',
  contact: '/help#contact',
}

const WELCOME: UiMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi, I'm the NaijaHandy assistant. Ask me about booking an artisan, payments, refunds, verification, disputes, or the guarantee.",
}

let nextId = 0

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME])
  const [turns, setTurns] = useState<ChatTranscriptItem[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [guest, setGuest] = useState<{ name: string; email: string } | null>(null)
  const [error, setError] = useState('')
  const [user, setUser] = useState<AuthUser | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(getStoredUser<AuthUser>())
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, sending])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (process.env.NEXT_PUBLIC_SUPPORT_CHAT_ENABLED !== 'true') return null

  const push = (m: Omit<UiMessage, 'id'>) => setMessages((prev) => [...prev, { ...m, id: `m${nextId++}` }])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError('')
    push({ role: 'user', text })
    setSending(true)
    push({ role: 'assistant', text: '', typing: true })
    try {
      const res = await sendChatMessage(text)
      setTurns((t) => [...t, { question: text, answer: res.answer }])
      setMessages((prev) => {
        const typing = prev.findLast((m) => m.typing)
        return typing
          ? prev.map((m) =>
              m.id === typing.id ? { ...m, typing: false, text: res.answer, sources: res.sources, actions: res.actions } : m,
            )
          : [...prev, { id: `m${nextId++}`, role: 'assistant', text: res.answer, sources: res.sources, actions: res.actions }]
      })
    } catch (err) {
      const message = getApiErrorMessage(err, 'Sorry — something went wrong. Please try again or use the Help Centre.')
      setMessages((prev) => {
        const typing = prev.findLast((m) => m.typing)
        return typing
          ? prev.map((m) => (m.id === typing.id ? { ...m, typing: false, text: message, role: 'system' as const } : m))
          : [...prev, { id: `m${nextId++}`, role: 'system' as const, text: message }]
      })
    } finally {
      setSending(false)
    }
  }

  const handleEscalate = async () => {
    setError('')
    if (!user && (!guest?.name || !guest?.email)) {
      setEscalating(true)
      return
    }
    setEscalating(true)
    try {
      await escalateChat({
        name: user?.name ?? guest?.name,
        email: user?.email ?? guest?.email,
        transcript: turns,
      })
      setEscalated(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open a support ticket. Please use the Help Centre contact form.'))
    } finally {
      setEscalating(false)
    }
  }

  const bubble =
    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line'
  const actionHref = (a: ChatAction) => ACTION_HREFS[a.action]

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && (
        <div
          role="dialog"
          aria-label="NaijaHandy assistant"
          className="mb-3 w-[min(92vw,22rem)] h-[min(70vh,30rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#047857] text-white">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-100" />
              </span>
              <p className="text-sm font-semibold truncate">NaijaHandy assistant</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
            {messages.map((m) => {
              if (m.typing) {
                return (
                  <div key={m.id} className="flex justify-start" role="status" aria-label="Assistant is typing">
                    <div className={`${bubble} bg-white border border-gray-100 flex gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                )
              }
              const isUser = m.role === 'user'
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`${bubble} ${
                      isUser
                        ? 'bg-[#047857] text-white rounded-br-sm'
                        : m.role === 'system'
                          ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-sm'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Sources</p>
                        {m.sources.map((s) => (
                          <a
                            key={s.slug}
                            href={`/help#${s.slug}`}
                            className="flex items-center gap-1.5 text-xs text-[#047857] hover:underline"
                          >
                            <ExternalLink size={12} aria-hidden="true" /> {s.title}
                          </a>
                        ))}
                      </div>
                    )}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.actions.map((a) => (
                          <a
                            key={a.action}
                            href={actionHref(a)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] text-[#047857] text-xs font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            {a.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {escalated ? (
              <div className="flex justify-start">
                <div className={`${bubble} bg-emerald-50 text-[#047857] border border-emerald-200 flex items-center gap-2 rounded-bl-sm`}>
                  <CheckCircle2 size={16} aria-hidden="true" /> A support ticket is open — our team will get back to you by email.
                </div>
              </div>
            ) : null}
          </div>

          {/* Escalate / footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-white">
            {escalating && !escalated && !user && (!guest?.name || !guest?.email) ? (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (guest?.name && guest?.email) void handleEscalate()
                }}
              >
                <p className="text-xs text-gray-500">To open a support ticket, tell us how to reach you:</p>
                <input
                  aria-label="Your name"
                  placeholder="Your name"
                  value={guest?.name || ''}
                  onChange={(e) => setGuest((g) => ({ name: e.target.value, email: g?.email || '' }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#047857]"
                />
                <input
                  aria-label="Your email"
                  type="email"
                  placeholder="you@example.com"
                  value={guest?.email || ''}
                  onChange={(e) => setGuest((g) => ({ name: g?.name || '', email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#047857]"
                />
                <button
                  type="submit"
                  disabled={!guest?.name || !guest?.email}
                  className="w-full py-2 rounded-lg bg-[#047857] text-white text-sm font-semibold disabled:opacity-50"
                >
                  Open support ticket
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => void handleEscalate()}
                  disabled={escalating || escalated}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#047857] transition-colors disabled:opacity-50"
                >
                  <LifeBuoy size={14} aria-hidden="true" />
                  {escalated ? 'Ticket opened' : escalating ? 'Opening…' : 'Talk to a human'}
                </button>
                <a href="/help" className="text-xs font-medium text-gray-500 hover:text-[#047857] transition-colors">
                  Open Help Centre
                </a>
              </div>
            )}
            {error && <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white">
            <input
              aria-label="Ask the NaijaHandy assistant"
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#047857] placeholder-gray-400"
            />
            <button
              onClick={() => void handleSend()}
              disabled={sending || !input.trim()}
              aria-label="Send question"
              className="p-2.5 rounded-lg bg-[#047857] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {sending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close the NaijaHandy assistant' : 'Chat with the NaijaHandy assistant'}
        aria-expanded={open}
        className="p-3.5 rounded-full bg-[#047857] text-white shadow-xl hover:opacity-90 transition-opacity"
      >
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
      </button>
    </div>
  )
}
