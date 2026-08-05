import { canTransitionBookingStatus } from '../../src/domain/booking'

describe('canTransitionBookingStatus', () => {
  it('allows valid forward transitions', () => {
    expect(canTransitionBookingStatus('PENDING', 'CONFIRMED')).toBe(true)
    expect(canTransitionBookingStatus('PENDING', 'CANCELLED')).toBe(true)
    expect(canTransitionBookingStatus('CONFIRMED', 'COMPLETED')).toBe(true)
    expect(canTransitionBookingStatus('CONFIRMED', 'CANCELLED')).toBe(true)
  })

  it('rejects backwards or terminal-state transitions', () => {
    expect(canTransitionBookingStatus('CONFIRMED', 'PENDING')).toBe(false)
    expect(canTransitionBookingStatus('COMPLETED', 'CONFIRMED')).toBe(false)
    expect(canTransitionBookingStatus('CANCELLED', 'CONFIRMED')).toBe(false)
    expect(canTransitionBookingStatus('PENDING', 'COMPLETED')).toBe(false)
  })

  it('rejects unknown statuses', () => {
    expect(canTransitionBookingStatus('X', 'CONFIRMED')).toBe(false)
    expect(canTransitionBookingStatus('PENDING', 'X')).toBe(false)
  })
})
