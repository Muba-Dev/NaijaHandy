'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  TrendingUp, Users, ShieldCheck, Star, Calendar, CreditCard, Scale, LogOut, Check, X, RefreshCcw, FileText, LifeBuoy, Camera, Trash2,
} from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import StatusBadge from '@/components/StatusBadge'
import { formatNGN, getApiErrorMessage, setStoredUser } from '@/lib/utils'
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

function Pill({ label, tone }: { label: string; tone: 'green' | 'amber' | 'red' | 'blue' | 'gray' }) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>{label}</span>
}

function approvalTone(s: string): 'green' | 'amber' | 'red' | 'gray' {
  if (s === 'APPROVED') return 'green'
  if (s === 'PENDING') return 'amber'
  if (s === 'REJECTED') return 'red'
  return 'gray'
}

function verificationTone(s: string): 'green' | 'amber' | 'red' | 'gray' {
  if (s === 'VERIFIED') return 'green'
  if (s === 'PENDING') return 'amber'
  if (s === 'REJECTED') return 'red'
  return 'gray'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('overview')
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

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
        setPayments(await fetchAdminPayments())
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
    setAvatarError('')
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image is too large. Maximum size is 2MB.')
      return
    }
    setUploadingAvatar(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Could not read the file'))
        reader.readAsDataURL(file)
      })
      const updated = await updateAvatar(dataUrl)
      setUser((u) => (u ? { ...u, ...updated } : u))
      setStoredUser(updated)
      flash('Profile photo updated')
    } catch (err) {
      setAvatarError(getApiErrorMessage(err, 'Failed to upload your photo. Please try again.'))
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
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
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-semibold text-gray-900 text-sm">{user?.name?.split(' ')[0] || 'Admin'}</p>
          <button onClick={async () => { await logout(); router.push('/login') }} className="flex items-center gap-1.5 text-sm text-gray-600">
            <LogOut size={16} /> Log Out
          </button>
        </div>
        <nav className="flex gap-1 px-2 pb-2 overflow-x-auto" aria-label="Admin console navigation">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = t.id === tab
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
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
      <div className="flex-1 p-5 md:p-8 overflow-auto pt-24 md:pt-8">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Admin Console</h1>
              <p className="text-gray-500 text-sm mt-0.5">{TABS.find((t) => t.id === tab)?.label}</p>
            </div>
            {notice && <span role="status" className="text-sm font-medium text-[#047857] bg-emerald-50 px-3 py-1.5 rounded-lg">{notice}</span>}
          </div>

          {tab === 'overview' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pending Approvals', value: stats.pendingArtisans, sub: 'artisans awaiting review', color: '#F59E0B', icon: ShieldCheck },
                { label: 'Total Artisans', value: stats.totalArtisans, sub: 'registered profiles', color: '#047857', icon: Users },
                { label: 'Registered Users', value: stats.totalUsers, sub: 'customers + artisans + admins', color: '#2563EB', icon: Users },
                { label: 'Bookings', value: stats.totalBookings, sub: 'all time', color: '#8B5CF6', icon: Calendar },
                { label: 'Open Disputes', value: stats.openDisputes, sub: 'need resolution', color: '#EF4444', icon: Scale },
                { label: 'Open Support', value: stats.openSupportMessages, sub: 'messages awaiting reply', color: '#8B5CF6', icon: LifeBuoy },
                { label: 'Hidden Reviews', value: stats.hiddenReviews, sub: 'moderated out', color: '#6B7280', icon: Star },
                { label: 'Revenue', value: formatNGN(stats.revenue), sub: 'successful payments', color: '#047857', icon: CreditCard },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-500">{s.label}</p>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                        <Icon size={16} style={{ color: s.color }} />
                      </div>
                    </div>
                    <p className="font-display text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'artisans' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setArtisanFilter(f)}
                    aria-pressed={artisanFilter === f}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${artisanFilter === f ? 'bg-[#047857] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {artisans.length === 0 && <p className="p-6 text-sm text-gray-500">No artisans match this filter.</p>}
                {artisans.map((a) => (
                  <div key={a.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                    <Image
                      src={a.user.avatar || DEFAULT_AVATAR}
                      alt={a.user.name}
                      width={48}
                      height={48}
                      className="rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{a.user.name}</p>
                        <Pill label={a.approvalStatus} tone={approvalTone(a.approvalStatus)} />
                        <Pill label={a.verificationStatus} tone={verificationTone(a.verificationStatus)} />
                        <Pill label={a.user.status} tone={a.user.status === 'SUSPENDED' ? 'red' : 'green'} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {a.profession} · {a.user.city || 'No city'} · {formatNGN(a.hourlyRate ?? 0)}/hr · ⭐ {(a.avgRating ?? 0).toFixed(1)} ({a.totalReviews}) · joined {fmtDate(a.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.user.email}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {a.approvalStatus !== 'APPROVED' ? (
                        <button disabled={busyId === a.id} onClick={() => onApprove(a.id, 'APPROVED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#047857] hover:opacity-90 disabled:opacity-50">
                          <Check size={13} /> Approve
                        </button>
                      ) : (
                        <button disabled={busyId === a.id} onClick={() => onApprove(a.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                          <X size={13} /> Reject
                        </button>
                      )}
                      {a.verificationDocUrl && (
                        <a
                          href={a.verificationDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FileText size={13} /> View ID
                        </a>
                      )}
                      {a.verificationStatus === 'PENDING' ? (
                        <>
                          <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'VERIFIED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50">
                            <Check size={13} /> Verify
                          </button>
                          <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                            <X size={13} /> Reject
                          </button>
                        </>
                      ) : a.verificationStatus !== 'VERIFIED' ? (
                        <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'VERIFIED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50">
                          <Check size={13} /> Verify
                        </button>
                      ) : (
                        <button disabled={busyId === a.id} onClick={() => onVerify(a.id, 'UNVERIFIED')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                          <RefreshCcw size={13} /> Unverify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  aria-label="Search users by name or email"
                  placeholder="Search by name or email…"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#047857]"
                />
                <div className="flex gap-2 flex-wrap">
                  {['ALL', 'CUSTOMER', 'ARTISAN'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setUserFilter(f)}
                      aria-pressed={userFilter === f}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${userFilter === f ? 'bg-[#047857] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                    >
                      {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['ALL', 'ACTIVE', 'SUSPENDED', 'DELETED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setUserStatusFilter(f)}
                    aria-pressed={userStatusFilter === f}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${userStatusFilter === f ? 'bg-[#047857] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                  >
                    {f === 'ALL' ? 'All statuses' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {users.length === 0 && <p className="p-6 text-sm text-gray-500">No users found.</p>}
                {users.map((u) => (
                  <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                    <Image
                      src={u.avatar || DEFAULT_AVATAR}
                      alt={u.name}
                      width={48}
                      height={48}
                      className="rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                        <Pill label={u.role} tone={u.role === 'ADMIN' ? 'blue' : u.role === 'ARTISAN' ? 'green' : 'gray'} />
                        <Pill label={u.status} tone={u.status === 'SUSPENDED' ? 'red' : u.status === 'DELETED' ? 'gray' : 'green'} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{u.email} · {u.city || 'No city'} · joined {fmtDate(u.createdAt)}</p>
                    </div>
                    {u.role !== 'ADMIN' && u.id !== user?.id && u.status !== 'DELETED' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={busyId === u.id}
                          onClick={() => onUserStatus(u.id, u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${u.status === 'SUSPENDED' ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                        >
                          {u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button
                          disabled={busyId === u.id}
                          onClick={() => setConfirmDelete(u)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['ALL', 'APPROVED', 'HIDDEN'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    aria-pressed={reviewFilter === f}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${reviewFilter === f ? 'bg-[#047857] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {reviews.length === 0 && <p className="p-6 text-sm text-gray-500">No reviews found.</p>}
                {reviews.map((r) => (
                  <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{r.customer.name}</p>
                        <span className="text-xs text-amber-500 font-semibold">{"⭐".repeat(r.rating)}</span>
                        <Pill label={r.status} tone={r.status === 'APPROVED' ? 'green' : 'gray'} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">on {r.artisan.profession} — {r.artisan.user.name} · {fmtDate(r.createdAt)}</p>
                      <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>
                      {r.photoUrl && (
                        <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                          <Image src={r.photoUrl} alt="Review photo" width={160} height={120} className="h-20 w-32 object-cover rounded-lg border border-gray-100" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {r.status !== 'APPROVED' ? (
                        <button disabled={busyId === r.id} onClick={() => onReviewStatus(r.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50">
                          Approve
                        </button>
                      ) : (
                        <button disabled={busyId === r.id} onClick={() => onReviewStatus(r.id, 'HIDDEN')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                          Hide
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setBookingFilter(f)}
                    aria-pressed={bookingFilter === f}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${bookingFilter === f ? 'bg-[#047857] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {bookings.length === 0 && <p className="p-6 text-sm text-gray-500">No bookings found.</p>}
                {bookings.map((b) => (
                  <div key={b.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{b.customer.name} → {b.artisan.user.name}</p>
                        <StatusBadge status={(b.status.charAt(0) + b.status.slice(1).toLowerCase()) as 'Pending' | 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled'} />
                        <Pill label={b.payment ? `PAID · ${b.payment.status}` : 'UNPAID'} tone={b.payment ? 'green' : 'amber'} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {b.artisan.profession} · {fmtDate(b.date)} at {b.time} · {formatNGN(b.amount)}
                        {b.description ? ` · “${b.description}”` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {payments.length === 0 && <p className="p-6 text-sm text-gray-500">No payments recorded yet.</p>}
              {payments.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{formatNGN(p.amount)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.status} · {p.method || 'n/a'} · ref {p.reference || '—'} · {fmtDate(p.createdAt)}
                      {p.booking ? ` · for booking ${p.booking.id.slice(-6).toUpperCase()}` : ''}
                    </p>
                  </div>
                  <Pill label={p.status} tone={p.status === 'SUCCESS' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'} />
                </div>
              ))}
            </div>
          )}

          {tab === 'disputes' && (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {disputes.length === 0 && <p className="p-6 text-sm text-gray-500">No disputes found.</p>}
              {disputes.map((d) => (
                <div key={d.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{d.user.name} vs {d.booking.artisan.user.name}</p>
                        <Pill label={d.status} tone={d.status === 'OPEN' ? 'red' : d.status === 'RESOLVED' ? 'green' : 'gray'} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {d.booking.artisan.profession} · booking {d.booking.id.slice(-6).toUpperCase()} · {fmtDate(d.booking.date)} · {formatNGN(d.booking.amount)} · filed {fmtDate(d.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1.5">“{d.reason}”</p>
                      {d.resolution && <p className="text-sm text-gray-500 mt-1.5">Resolution: {d.resolution}</p>}
                    </div>
                  </div>
                  {d.status === 'OPEN' && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      {resolving !== d.id ? (
                        <button
                          onClick={() => { setResolving(d.id); setResolutionText('') }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#047857] hover:opacity-90"
                        >
                          Resolve
                        </button>
                      ) : (
                        <>
                          <input
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            placeholder="Resolution note…"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#047857]"
                          />
                          <button disabled={busyId === d.id || !resolutionText.trim()} onClick={() => onResolve(d.id, 'RESOLVED')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#047857] hover:opacity-90 disabled:opacity-50">
                            Resolve
                          </button>
                          <button disabled={busyId === d.id} onClick={() => onResolve(d.id, 'DISMISSED')} className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'support' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['ALL', 'OPEN', 'REPLIED', 'CLOSED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSupportFilter(f)}
                    aria-pressed={supportFilter === f}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${supportFilter === f ? 'bg-[#047857] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {support.length === 0 && <p className="p-6 text-sm text-gray-500">No support messages found.</p>}
                {support.map((m) => (
                  <div key={m.id} className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{m.subject}</p>
                          <Pill label={m.status} tone={m.status === 'OPEN' ? 'red' : m.status === 'REPLIED' ? 'amber' : 'gray'} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ''}{m.user ? ` · account ${m.user.id.slice(0, 8)}` : ' · guest'} · {fmtDate(m.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap">“{m.message}”</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={busyId === m.id}
                          onClick={() => onSupportStatus(m.id, m.status === 'OPEN' ? 'REPLIED' : m.status === 'REPLIED' ? 'OPEN' : 'REPLIED')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {m.status === 'OPEN' ? 'Mark replied' : m.status === 'REPLIED' ? 'Reopen' : 'Reopen'}
                        </button>
                        <button
                          disabled={busyId === m.id}
                          onClick={() => onSupportStatus(m.id, m.status === 'CLOSED' ? 'OPEN' : 'CLOSED')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                          {m.status === 'CLOSED' ? 'Reopen' : 'Close'}
                        </button>
                        <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                          Reply
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
