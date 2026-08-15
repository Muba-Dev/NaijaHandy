import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

// Reads a user-selected image and returns a compressed data URL so profile
// photos (especially large phone photos) upload reliably on mobile.
export function compressImage(file: File, maxDimension = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Could not process the image'))
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the file'))
    }
    img.src = url
  })
}

export function minServiceRate(services: Array<{ rate: number }>): number | null {
  if (!services || services.length === 0) return null
  return Math.min(...services.map((s) => s.rate))
}

export function estimateBookingAmount(
  services: Array<{ name: string; rate: number }>,
  serviceName: string,
  hours: number,
  hourlyRate: number,
): { unitRate: number; serviceFee: number; platformFee: number; total: number } {
  const match = services.find((s) => s.name === serviceName)
  const unitRate = match ? match.rate : hourlyRate
  const serviceFee = unitRate * hours
  const platformFee = 500
  return { unitRate, serviceFee, platformFee, total: serviceFee + platformFee }
}

export function parsePhoneDigits(phone: string | null | undefined): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) digits = `234${digits.slice(1)}`
  if (digits.length < 10) return null
  return digits
}

export function isWhatsAppPhone(phone: string | null | undefined): boolean {
  return parsePhoneDigits(phone) !== null
}

export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  const digits = parsePhoneDigits(phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message?: unknown }).message
      if (typeof msg === 'string' && msg) return msg
      if (Array.isArray(msg) && msg.length) {
        const first = msg[0]
        if (typeof first === 'string') return first
        if (first && typeof first === 'object' && 'message' in first) {
          const nested = (first as { message?: unknown }).message
          if (typeof nested === 'string') return nested
        }
        return String(first)
      }
    }
  }
  return fallback
}

const ACCESS_TOKEN_KEY = 'naijahandy_access_token'
const REFRESH_TOKEN_KEY = 'naijahandy_refresh_token'
const USER_KEY = 'naijahandy_user'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function getStoredUser<U = { id: string; name: string; email: string; role: 'CUSTOMER' | 'ARTISAN' }>(): U | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as U
  } catch {
    return null
  }
}

export function setStoredUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
