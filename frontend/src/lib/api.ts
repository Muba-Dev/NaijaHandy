import axios from 'axios'
import type { Artisan, Booking, AuthUser, LoginCredentials, RegisterPayload, AdminStats, AdminUser, AdminArtisan, AdminReview, AdminBooking, AdminPayment, AdminDispute } from '@/types'
import { getAuthToken, getRefreshToken, setAuthTokens, setStoredUser, clearAuthTokens } from '@/lib/utils'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest || originalRequest._retry) return Promise.reject(error)

    if (error.response?.status === 401) {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearAuthTokens()
        return Promise.reject(error)
      }

      originalRequest._retry = true
      try {
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/refresh`, {
          refreshToken,
        })
        setAuthTokens(data.accessToken, data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        clearAuthTokens()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// ─── Normalizers (backend shape → UI shape) ──────────────────────────────────

type RawArtisan = {
  id: string
  profession: string
  category: string
  bio: string
  hourlyRate: number
  coverImage: string | null
  verified: boolean
  available: boolean
  avgRating: number
  totalReviews: number
  user: { id: string; name: string; city: string | null; avatar: string | null }
  services: { name: string; rate: number }[]
  portfolio?: { imageUrl: string; caption?: string | null }[]
  reviews?: {
    rating: number
    comment: string
    createdAt: string
    customer: { name: string; avatar: string | null }
  }[]
}

function normalizeArtisan(a: RawArtisan): Artisan {
  return {
    id: a.id,
    name: a.user.name,
    profession: a.profession,
    city: a.user.city || '',
    rating: a.avgRating,
    reviews: a.totalReviews,
    hourlyRate: a.hourlyRate,
    verified: a.verified,
    bio: a.bio,
    avatar: a.user.avatar || '',
    cover: a.coverImage || '',
    category: a.category,
    available: a.available,
    portfolio: (a.portfolio || []).map((p) => p.imageUrl),
    services: a.services || [],
    reviews_list: (a.reviews || []).map((r) => ({
      name: r.customer.name,
      rating: r.rating,
      comment: r.comment,
      date: new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }),
      avatar: r.customer.avatar || '',
    })),
  }
}

type RawBooking = {
  id: string
  date: string
  time: string
  description: string
  amount: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  paymentReference?: string | null
  artisan: { id: string; profession: string; user: { name: string; avatar: string | null } }
  customer: { name: string; avatar: string | null }
  payment?: { status: string; reference: string } | null
}

function normalizeBooking(b: RawBooking): Booking {
  return {
    id: b.id,
    artisanId: b.artisan.id,
    artisan: b.artisan.user.name,
    profession: b.artisan.profession,
    date: new Date(b.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    dateISO: b.date,
    time: b.time,
    description: b.description,
    amount: b.amount,
    status: (b.status.charAt(0) + b.status.slice(1).toLowerCase()) as Booking['status'],
    avatar: b.artisan.user.avatar || '',
<<<<<<< HEAD
    description: b.description,
    customer: b.customer?.name,
    customerAvatar: b.customer?.avatar || '',
=======
    paymentStatus: b.paymentStatus,
    paymentReference: b.paymentReference,
>>>>>>> b2868093eae5e26623da02565804cad13422632d
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', credentials)
  setAuthTokens(data.accessToken, data.refreshToken)
  setStoredUser(data.user)
  return data.user
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await api.post('/auth/register', payload)
  setAuthTokens(data.accessToken, data.refreshToken)
  setStoredUser(data.user)
  return data.user
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  clearAuthTokens()
  if (refreshToken) {
    await api.post('/auth/logout', { refreshToken }).catch(() => undefined)
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get('/users/me')
  setStoredUser(data.data)
  return data.data
}

// ─── Artisans ─────────────────────────────────────────────────────────────────

export async function fetchArtisans(params?: Record<string, string>): Promise<Artisan[]> {
  const { data } = await api.get('/artisans', { params })
  return data.data.map(normalizeArtisan)
}

export async function fetchArtisanById(id: string): Promise<Artisan> {
  const { data } = await api.get(`/artisans/${id}`)
  return normalizeArtisan(data.data)
}

export async function fetchSavedArtisans(): Promise<Artisan[]> {
  const { data } = await api.get('/saved-artisans')
  return data.data.map(normalizeArtisan)
}

export async function saveArtisan(artisanId: string) {
  const { data } = await api.post(`/saved-artisans/${artisanId}`)
  return data.data
}

export async function unsaveArtisan(artisanId: string) {
  const { data } = await api.delete(`/saved-artisans/${artisanId}`)
  return data.data
}

export async function fetchMyArtisanProfile(): Promise<Artisan> {
  const { data } = await api.get('/artisans/me')
  return normalizeArtisan(data.data)
}

export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  const { data } = await api.get('/artisans/categories')
  const counts: Record<string, number> = {}
  for (const item of data.data) counts[item.name] = item.count
  return counts
}

export async function updateArtisanProfile(payload: Record<string, unknown>) {
  const { data } = await api.patch('/artisans/me', payload)
  return data.data
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchBookings(): Promise<Booking[]> {
  const { data } = await api.get('/bookings')
  return data.data.map(normalizeBooking)
}

export async function createBooking(payload: {
  artisanId: string
  date: string
  time: string
  description: string
  amount: number
}) {
  const { data } = await api.post('/bookings', payload)
  return data.data
}

export async function updateBookingStatus(id: string, status: string) {
  const { data } = await api.patch(`/bookings/${id}/status`, { status })
  return data.data
}

export async function raiseDispute(bookingId: string, reason: string) {
  const { data } = await api.post(`/bookings/${bookingId}/dispute`, { reason })
  return data.data
}

export async function initializePayment(bookingId: string): Promise<{ authorization_url: string; reference: string }> {
  const { data } = await api.post('/payments/initialize', { bookingId })
  return data.data
}

export async function verifyPayment(reference: string) {
  const { data } = await api.get(`/payments/verify/${encodeURIComponent(reference)}`)
  return data.data
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function updateProfile(payload: { name?: string; phone?: string; city?: string; avatar?: string }) {
  const { data } = await api.patch('/users/me', payload)
  return data.data
}

export async function updateAvatar(image: string): Promise<AuthUser> {
  const { data } = await api.post('/users/me/avatar', { image })
  return data.data
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get('/admin/stats')
  return data.data
}

export async function fetchAdminArtisans(params?: Record<string, string>): Promise<{ data: AdminArtisan[]; total: number }> {
  const { data } = await api.get('/admin/artisans', { params })
  return data.data
}

export async function setArtisanApproval(id: string, approvalStatus: string) {
  const { data } = await api.patch(`/admin/artisans/${id}/approval`, { approvalStatus })
  return data.data
}

export async function setArtisanVerification(id: string, verificationStatus: string) {
  const { data } = await api.patch(`/admin/artisans/${id}/verification`, { verificationStatus })
  return data.data
}

export async function fetchAdminUsers(params?: Record<string, string>): Promise<{ data: AdminUser[]; total: number }> {
  const { data } = await api.get('/admin/users', { params })
  return data.data
}

export async function setUserStatus(id: string, status: string) {
  const { data } = await api.patch(`/admin/users/${id}/status`, { status })
  return data.data
}

export async function fetchAdminReviews(params?: Record<string, string>): Promise<{ data: AdminReview[]; total: number }> {
  const { data } = await api.get('/admin/reviews', { params })
  return data.data
}

export async function setReviewStatus(id: string, status: string) {
  const { data } = await api.patch(`/admin/reviews/${id}/status`, { status })
  return data.data
}

export async function fetchAdminBookings(params?: Record<string, string>): Promise<{ data: AdminBooking[]; total: number }> {
  const { data } = await api.get('/admin/bookings', { params })
  return data.data
}

export async function fetchAdminPayments(): Promise<AdminPayment[]> {
  const { data } = await api.get('/admin/payments')
  return data.data
}

export async function fetchAdminDisputes(params?: Record<string, string>): Promise<{ data: AdminDispute[]; total: number }> {
  const { data } = await api.get('/admin/disputes', { params })
  return data.data
}

export async function resolveDispute(id: string, status: string, resolution: string) {
  const { data } = await api.post(`/admin/disputes/${id}/resolve`, { status, resolution })
  return data.data
}

export default api
