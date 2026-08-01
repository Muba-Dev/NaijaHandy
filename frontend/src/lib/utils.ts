import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

// Replace with real token logic when backend is ready
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('artisanng_token')
}

export function setAuthToken(token: string): void {
  localStorage.setItem('artisanng_token', token)
}

export function clearAuthToken(): void {
  localStorage.removeItem('artisanng_token')
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
