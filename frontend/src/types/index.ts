export interface Artisan {
  id: string
  name: string
  profession: string
  city: string
  rating: number
  reviews: number
  hourlyRate: number
  verified: boolean
  bio: string
  avatar: string
  cover: string
  category: string
  available: boolean
  portfolio: string[]
  services: Service[]
  reviews_list: Review[]
}

export interface Service {
  name: string
  rate: number
}

export interface Review {
  name: string
  rating: number
  comment: string
  date: string
  avatar: string
}

export interface Category {
  name: string
  count: number
}

export interface Booking {
  id: string
  artisan: string
  profession: string
  date: string
  time: string
  amount: number
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  avatar: string
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'

// API response types — replace mock data with these when backend is ready
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'ARTISAN'
  phone?: string
  avatar?: string
  city?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  city: string
  password: string
  role: 'CUSTOMER' | 'ARTISAN'
  profession?: string
  category?: string
}
