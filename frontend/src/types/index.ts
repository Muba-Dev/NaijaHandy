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
  artisanId: string
  artisan: string
  profession: string
  date: string
  dateISO: string
  time: string
  description: string
  amount: number
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  avatar: string
<<<<<<< HEAD
  description?: string
  customer?: string
  customerAvatar?: string
=======
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  paymentReference?: string | null
>>>>>>> b2868093eae5e26623da02565804cad13422632d
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
  role: 'CUSTOMER' | 'ARTISAN' | 'ADMIN'
  phone?: string
  avatar?: string
  city?: string
}

export type AdminUserRole = 'CUSTOMER' | 'ARTISAN' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED'
export type ReviewStatus = 'APPROVED' | 'HIDDEN'
export type DisputeStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED'

export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  role: AdminUserRole
  status: UserStatus
  avatar: string | null
  createdAt: string
}

export interface AdminArtisan {
  id: string
  profession: string
  category: string | null
  bio: string | null
  hourlyRate: number | null
  verified: boolean
  available: boolean
  avgRating: number | null
  totalReviews: number
  approvalStatus: ApprovalStatus
  verificationStatus: VerificationStatus
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    city: string | null
    avatar: string | null
    status: UserStatus
  }
}

export interface AdminReview {
  id: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: string
  customer: { id: string; name: string; avatar: string | null }
  artisan: { profession: string; user: { id: string; name: string } }
  booking: { id: string; amount: number } | null
}

export interface AdminBooking {
  id: string
  date: string
  time: string
  description: string | null
  amount: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  customer: { id: string; name: string; email: string }
  artisan: { profession: string; user: { id: string; name: string } }
  payment: {
    id: string
    amount: number
    status: string
    method: string | null
    reference: string | null
    createdAt: string
  } | null
}

export interface AdminPayment {
  id: string
  amount: number
  status: string
  method: string | null
  reference: string | null
  createdAt: string
  booking: { id: string; description: string | null; amount: number } | null
}

export interface AdminDispute {
  id: string
  reason: string
  status: DisputeStatus
  resolution: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
  booking: {
    id: string
    date: string
    amount: number
    status: string
    artisan: { profession: string; user: { id: string; name: string } }
  }
}

export interface AdminStats {
  pendingArtisans: number
  totalArtisans: number
  totalUsers: number
  totalBookings: number
  hiddenReviews: number
  openDisputes: number
  revenue: number
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
