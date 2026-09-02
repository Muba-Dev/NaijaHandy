'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  TrendingUp, Users, ShieldCheck, Star, Calendar, CreditCard, Scale, LogOut, Trash2, Camera, LifeBuoy,
} from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import Brand from '@/components/Brand'
import useImageUpload from '@/hooks/useImageUpload'
import { setStoredUser } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/data'
import {
  fetchAdminStats, fetchAdminArtisans, setArtisanApproval, setArtisanVerification,
  fetchAdminUsers, setUserStatus, deleteUser, fetchAdminReviews, setReviewStatus,
  fetchAdminBookings, fetchAdminPayments, fetchAdminDisputes, resolveDispute, logout,
  fetchAdminSupportMessages, setSupportMessageStatus, fetchMe, updateAvatar,
} from '@/lib/api'
import type {
  AdminStats, AdminArtisan, AdminUser, AdminReview, AdminBooking, AdminPayment, AdminDispute,
  AuthUser, SupportMessage,
} from '@/types'
import StatsGrid from '@/components/admin/stats'
import ArtisansTab from '@/components/admin/ArtisansTab'
import UsersTab from '@/components/admin/UsersTab'
import ReviewsTab from '@/components/admin/ReviewsTab'
import BookingsTab from '@/components/admin/BookingsTab'
import PaymentsTab from '@/components/admin/PaymentsTab'
import DisputesTab from '@/components/admin/DisputesTab'
import SupportTab from '@/components/admin/SupportTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'artisans', label: 'Artisans', icon: ShieldCheck },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'disputes', label: 'Disputes', icon: Scale },
  { id: 'support', label: 'Support', icon: LifeBuoy },
] as const

type TabId = (typeof TABS)[number]['id']

const ALL_TAB_IDS = TABS.map((t) => t.id)

function isTabId(v: string | null): v is TabId {
  return !!v && (ALL_TAB_IDS as string[]).includes(v)
}

export default function AdminDashboardPage() {
  const router = useRouter()
  // Persist the active tab in the URL (?tab=…) so the selection survives a
  // reload and is shareable. Falls back to the in-memory default if absent.
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get('tab')
      if (isTabId(fromUrl)) return fromUrl
    }
    return 'overview'
  })
  const [user, setUser] = useState<AuthUser | null>(null)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [artisans, setArtisans] = useState<AdminArtisan[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [support, setSupport] = useState<SupportMessage[]>([])

  const [artisanFilter, setArtisanFilter] = useState('ALL')
  const [userFilter, setUserFilter] = useState('ALL')
  const [userStatusFilter, setUserStatusFilter] = useState('ALL')
  const [reviewFilter, setReviewFilter] = useState('ALL')
  const [bookingFilter, setBookingFilter] = useState('ALL')
  const [disputeFilter] = useState('ALL')
  const [supportFilter, setSupportFilter] = useState('ALL')
  const [userSearch, setUserSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Keep the ?tab= URL segment in sync with the selected tab (non-navigating).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.get('tab') !== tab) {
      url.searchParams.set('tab', tab)
      window.history.replaceState(null, '', url.pathname + url.search)
    }
  }, [tab])

  const { busy: uploadingAvatar, error: avatarError, handleFile: handleAvatarFile } = useImageUpload({
    validate: (file) => {
      if (!file.type.startsWith('image/')) return 'Please choose an image file (JPG, PNG or WebP).'
      if (file.size > 15 * 1024 * 1024) return 'Image is too large. Please choose a photo under 15MB.'
      return null
    },
    fallbackError: 'Failed to upload your photo. Please try again.',
  })

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const refreshAll = useCallback(async () => {
    try {
      const s = await fetchAdminStats()
      setStats(s)
    } catch { /* ignore */ }
  }, [])

  const loadTab = useCallback(async () => {
    try {
      if (tab === 'artisans') {
        const params: Record<string, string> = {}
        if (artisanFilter !== 'ALL') params.approvalStatus = artisanFilter
        const r = await fetchAdminArtisans(params)
        setArtisans(r.data)
      } else if (tab === 'users') {
        const params: Record<string, string> = {}
        if (userFilter !== 'ALL') params.role = userFilter
        if (userStatusFilter !== 'ALL') params.status = userStatusFilter
        if (userSearch.trim()) params.search = userSearch.trim()
        const r = await fetchAdminUsers(params)
        setUsers(r.data)
      } else if (tab === 'reviews') {
        const params: Record<string, string> = {}
        if (reviewFilter !== 'ALL') params.status = reviewFilter
        const r = await fetchAdminReviews(params)
        setReviews(r.data)
      } else if (tab === 'bookings') {
        const params: Record<string, string> = {}
        if (bookingFilter !== 'ALL') params.status = bookingFilter
        const r = await fetchAdminBookings(params)
        setBookings(r.data)
      } else if (tab === 'payments') {
        const r = await fetchAdminPayments()
        setPayments(r.data)
      } else if (tab === 'disputes') {
        const params: Record<string, string> = {}
        if (disputeFilter !== 'ALL') params.status = disputeFilter
        const r = await fetchAdminDisputes(params)
        setDisputes(r.data)
      } else if (tab === 'support') {
        const params: Record<string, string> = {}
        if (supportFilter !== 'ALL') params.status = supportFilter
        const r = await fetchAdminSupportMessages(params)
        setSupport(r.data)
      }
    } catch { /* ignore */ }
  }, [tab, artisanFilter, userFilter, userStatusFilter, reviewFilter, bookingFilter, disputeFilter, supportFilter, userSearch])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('naijahandy_user') || 'null')
    setUser(stored)
    fetchMe().then((fresh) => {
      setUser((u) => (u ? { ...u, ...fresh } : fresh))
      setStoredUser(fresh)
    }).catch(() => {})
    refreshAll()
  }, [refreshAll])

  useEffect(() => {
    loadTab()
  }, [loadTab])

  useEffect(() => {
    if (tab === 'overview') refreshAll()
  }, [tab, refreshAll])

  const onApprove = async (id: string, approvalStatus: string) => {
    setBusyId(id)
    try {
      await setArtisanApproval(id, approvalStatus)
      flash(`Artisan ${approvalStatus === 'APPROVED' ? 'approved' : 'rejected'}`)
      loadTab(); refreshAll()
    } catch { flash('Action failed') }
    setBusyId(null)
  }

  const onVerify = async (id: string, verificationStatus: string) => {
    setBusyId(id)
    try {
      await setArtisanVerification(id, verificationStatus)
      flash(`Identity ${verificationStatus === 'VERIFIED' ? 'verified' : 'unverified'}`)
      loadTab()
    } catch { flash('Action failed') }
    setBusyId(null)
  }

  const onUserStatus = async (id: string, status: string) => {
    setBusyId(id)
    try {
      await setUserStatus(id, status)
      flash(`Account ${status === 'SUSPENDED' ? 'suspended' : 'activated'}`)
      loadTab(); refreshAll()
    } catch { flash('Action failed') }
    setBusyId(null)
  }

  const onDeleteUser = async (u: AdminUser) => {
    setBusyId(u.id)
    try {
      await deleteUser(u.id)
      setConfirmDelete(null)
      flash(`${u.name}'s account has been deleted`)
      loadTab(); refreshAll()
    } catch { flash('Failed to delete account') }
    setBusyId(null)
  }

  const onReviewStatus = async (id: string, status: string) => {
    setBusyId(id)
    try {
      await setReviewStatus(id, status)
      flash(`Review ${status === 'HIDDEN' ? 'hidden' : 'approved'}`)
      loadTab(); refreshAll()
    } catch { flash('Action failed') }
    setBusyId(null)
  }

  const onResolve = async (id: string, status: string) => {
    setBusyId(id)
    try {
      await resolveDispute(id, status, resolutionText)
      flash(`Dispute ${status === 'RESOLVED' ? 'resolved' : 'dismissed'}`)
      setResolving(null); setResolutionText('')
      loadTab(); refreshAll()
    } catch { flash('Action failed') }
    setBusyId(null)
  }

  const onSupportStatus = async (id: string, status: SupportMessage['status']) => {
    setBusyId(id)
    try {
      await setSupportMessageStatus(id, status)
      flash(`Message marked ${status === 'REPLIED' ? 'replied' : status === 'CLOSED' ? 'closed' : 'open'}`)
      loadTab(); refreshAll()
    } catch { flash('Action failed') }
    setBusyId(null)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleAvatarFile(file, async (dataUrl) => {
      const updated = await updateAvatar(dataUrl)
      setUser((u) => (u ? { ...u, ...updated } : u))
      setStoredUser(updated)
      flash('Profile photo updated')
    })
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Image
                src={user?.avatar || DEFAULT_AVATAR}
                alt={user?.name || 'Admin'}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change profile photo"
                title="Change profile photo"
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#047857] text-white flex items-center justify-center border-2 border-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Camera size={11} aria-hidden="true" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.name?.split(' ')[0] || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            id="admin-avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <div className="mt-3">
            {uploadingAvatar ? (
              <p className="text-xs text-gray-500">Uploading…</p>
            ) : (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs font-medium text-[#047857] hover:text-[#065f46] transition-colors"
              >
                Change Photo
              </button>
            )}
            {avatarError && <p className="text-xs text-red-600 mt-1" role="alert">{avatarError}</p>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Admin console navigation">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = t.id === tab
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={isActive}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={16} aria-hidden="true" />
                {t.label}
                {t.id === 'artisans' && stats && stats.pendingArtisans > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">{stats.pendingArtisans}</span>
                )}
                {t.id === 'disputes' && stats && stats.openDisputes > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{stats.openDisputes}</span>
                )}
                {t.id === 'support' && stats && stats.openSupportMessages > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{stats.openSupportMessages}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={async () => { await logout(); router.push('/login') }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed top-0 inset-x-0 z-20 bg-white border-b border-gray-100 md:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
          <Brand compact />
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2.5 pl-1 pr-1">
              <Image
                src={user?.avatar || DEFAULT_AVATAR}
                alt=""
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
              <span className="text-sm font-medium text-gray-800">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </div>
            <button
              onClick={async () => { await logout(); router.push('/login') }}
              aria-label="Log out"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav className="flex gap-1 px-3 pt-2 pb-3 overflow-x-auto border-t border-gray-100" aria-label="Admin console navigation">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = t.id === tab
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-[#047857] bg-[#047857]/10' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon size={13} aria-hidden="true" />
                {t.label}
                {t.id === 'artisans' && stats && stats.pendingArtisans > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">{stats.pendingArtisans}</span>
                )}
                {t.id === 'disputes' && stats && stats.openDisputes > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">{stats.openDisputes}</span>
                )}
                {t.id === 'support' && stats && stats.openSupportMessages > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">{stats.openSupportMessages}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-5 md:p-8 overflow-auto pt-28 md:pt-8">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Admin Console</h1>
              <p className="text-gray-500 text-sm mt-0.5">{TABS.find((t) => t.id === tab)?.label}</p>
            </div>
            {notice && <span role="status" className="text-sm font-medium text-[#047857] bg-emerald-50 px-3 py-1.5 rounded-lg">{notice}</span>}
          </div>

          {tab === 'overview' && stats && <StatsGrid stats={stats} />}

          {tab === 'artisans' && (
            <ArtisansTab
              artisans={artisans}
              filter={artisanFilter}
              onFilterChange={setArtisanFilter}
              busyId={busyId}
              onApprove={onApprove}
              onVerify={onVerify}
            />
          )}

          {tab === 'users' && (
            <UsersTab
              users={users}
              currentUserId={user?.id}
              userSearch={userSearch}
              onUserSearch={setUserSearch}
              roleFilter={userFilter}
              onRoleFilterChange={setUserFilter}
              statusFilter={userStatusFilter}
              onStatusFilterChange={setUserStatusFilter}
              busyId={busyId}
              onUserStatus={onUserStatus}
              onRequestDelete={setConfirmDelete}
            />
          )}

          {tab === 'reviews' && (
            <ReviewsTab
              reviews={reviews}
              filter={reviewFilter}
              onFilterChange={setReviewFilter}
              busyId={busyId}
              onReviewStatus={onReviewStatus}
            />
          )}

          {tab === 'bookings' && (
            <BookingsTab bookings={bookings} filter={bookingFilter} onFilterChange={setBookingFilter} />
          )}

          {tab === 'payments' && <PaymentsTab payments={payments} />}

          {tab === 'disputes' && (
            <DisputesTab
              disputes={disputes}
              busyId={busyId}
              resolving={resolving}
              resolutionText={resolutionText}
              onResolutionTextChange={setResolutionText}
              onBeginResolve={(id) => { setResolving(id); setResolutionText('') }}
              onResolve={onResolve}
            />
          )}

          {tab === 'support' && (
            <SupportTab
              messages={support}
              filter={supportFilter}
              onFilterChange={setSupportFilter}
              busyId={busyId}
              onStatus={onSupportStatus}
            />
          )}
        </div>
      </div>
    </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} aria-hidden />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-user-title" className="text-lg font-bold text-gray-900">Delete {confirmDelete.name}?</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              This permanently removes their account. Their sign-in is disabled, and their name, email, phone and photo are
              wiped. Historical records such as bookings and reviews are kept for data integrity. This cannot be undone.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              {confirmDelete.role === 'ARTISAN' ? 'Their artisan profile will also be taken offline and hidden from the marketplace.' : 'Any active sessions are revoked immediately.'}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={busyId === confirmDelete.id}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDeleteUser(confirmDelete)}
                disabled={busyId === confirmDelete.id}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {busyId === confirmDelete.id ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
