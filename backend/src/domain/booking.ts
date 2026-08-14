export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const BOOKING_PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'] as const
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUSES)[number]

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
}

export function canTransitionBookingStatus(current: string, next: string): boolean {
  if (!BOOKING_STATUSES.includes(current as BookingStatus) || !BOOKING_STATUSES.includes(next as BookingStatus)) return false
  return allowedTransitions[current as BookingStatus].includes(next as BookingStatus)
}