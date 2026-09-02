export const PILL_TONES = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
} as const

export type PillTone = keyof typeof PILL_TONES

export function Pill({ label, tone }: { label: string; tone: PillTone }) {
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${PILL_TONES[tone]}`}>{label}</span>
}

export function approvalTone(s: string): PillTone {
  if (s === 'APPROVED') return 'green'
  if (s === 'PENDING') return 'amber'
  if (s === 'REJECTED') return 'red'
  return 'gray'
}

export function verificationTone(s: string): PillTone {
  if (s === 'VERIFIED') return 'green'
  if (s === 'PENDING') return 'amber'
  if (s === 'REJECTED') return 'red'
  return 'gray'
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}