import axios from 'axios'
import type { Artisan, Booking, AuthUser, LoginCredentials, RegisterPayload } from '@/types'
import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/utils'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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
  artisan: { profession: string; user: { name: string; avatar: string | null } }
  customer: { name: string; avatar: string | null }
}

function normalizeBooking(b: RawBooking): Booking {
  return {
    id: b.id,
    artisan: b.artisan.user.name,
    profession: b.artisan.profession,
    date: new Date(b.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: b.time,
    amount: b.amount,
    status: (b.status.charAt(0) + b.status.slice(1).toLowerCase()) as Booking['status'],
    avatar: b.artisan.user.avatar || '',
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', credentials)
  setAuthToken(data.token)
  return data.user
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await api.post('/auth/register', payload)
  setAuthToken(data.token)
  return data.user
}

export function logout(): void {
  clearAuthToken()
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get('/users/me')
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

export async function fetchMyArtisanProfile(): Promise<Artisan> {
  const { data } = await api.get('/artisans/me')
  return normalizeArtisan(data.data)
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

// ─── Users ────────────────────────────────────────────────────────────────────

export async function updateProfile(payload: { name?: string; phone?: string; city?: string; avatar?: string }) {
  const { data } = await api.patch('/users/me', payload)
  return data.data
}

export default api
