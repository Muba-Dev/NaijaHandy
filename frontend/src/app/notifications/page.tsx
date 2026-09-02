'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, ArrowRight } from 'lucide-react'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'
import AuthGuard from '@/components/AuthGuard'
import Spinner from '@/components/ui/Spinner'
import type { AppNotification } from '@/types'

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNotifications(await fetchNotifications())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notifications.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleOpen = async (n: AppNotification) => {
    if (!n.read) {
      setNotifications((list) => list.map((item) => (item.id === n.id ? { ...item, read: true } : item)))
      markNotificationRead(n.id).catch(() => undefined)
    }
    if (n.link) router.push(n.link)
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    setError('')
    try {
      await markAllNotificationsRead()
      setNotifications((list) => list.map((n) => ({ ...n, read: true })))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to mark notifications as read.'))
    } finally {
      setMarkingAll(false)
    }
  }

  const unread = notifications.filter((n) => !n.read).length

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {unread > 0 ? `You have ${unread} unread notification${unread === 1 ? '' : 's'}` : 'You’re all caught up'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <CheckCheck size={15} aria-hidden="true" />
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-3" aria-hidden="true" />
            <p className="text-gray-500 text-sm">No notifications yet. Updates about your bookings, reviews and payments will show up here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                {n.link ? (
                  <button
                    onClick={() => handleOpen(n)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-colors ${n.read ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50'}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-[#047857]'}`} aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">{n.title}</span>
                      <span className="block text-sm text-gray-600 mt-0.5">{n.body}</span>
                      <span className="block text-xs text-gray-700 mt-1">{timeAgo(n.createdAt)}</span>
                    </span>
                    <ArrowRight size={15} className="text-gray-400 shrink-0 mt-1.5" aria-hidden="true" />
                  </button>
                ) : (
                  <div className={`flex items-start gap-3 p-4 rounded-2xl border ${n.read ? 'bg-white border-gray-100' : 'bg-emerald-50/60 border-emerald-100'}`}>
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-[#047857]'}`} aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">{n.title}</span>
                      <span className="block text-sm text-gray-600 mt-0.5">{n.body}</span>
                      <span className="block text-xs text-gray-700 mt-1">{timeAgo(n.createdAt)}</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AuthGuard>
  )
}
