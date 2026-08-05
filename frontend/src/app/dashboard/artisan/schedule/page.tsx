'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchBookings } from '@/lib/api'
import { formatNGN } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { Booking, BookingStatus } from '@/types'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default function MySchedulePage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    fetchBookings().then(setBookings).catch(() => setBookings([]))
  }, [])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthLabel = cursor.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7
  const today = new Date()

  const isSameMonth = (iso: string) => {
    const d = new Date(iso)
    return d.getFullYear() === year && d.getMonth() === month
  }

  const bookedDays: Record<number, Booking[]> = {}
  for (const b of bookings) {
    if (isSameMonth(b.dateISO)) {
      const day = new Date(b.dateISO).getDate()
      bookedDays[day] = bookedDays[day] || []
      bookedDays[day].push(b)
    }
  }

  const monthBookings = bookings.filter((b) => isSameMonth(b.dateISO)).sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
  const upcoming = bookings
    .filter((b) => (b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.dateISO) >= startOfMonth(today))
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))

  return (
    <>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your confirmed jobs and availability</p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{monthLabel}</h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }, (_, i) => <div key={`blank-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const hasJobs = !!bookedDays[day]?.length
            const jobCount = bookedDays[day]?.length || 0
            return (
              <button
                key={day}
                className={`aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-colors ${isToday ? 'text-white bg-[#047857]' : hasJobs ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {day}
                {hasJobs && !isToday && <span className="w-1 h-1 rounded-full bg-amber-600 mt-0.5" />}
                {isToday && <span className="text-[9px] opacity-90 mt-0.5">Today</span>}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#047857]" />Today</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100" />Booked ({monthBookings.length})</div>
        </div>
      </div>

      {/* Jobs this month */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Jobs in {monthLabel}</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {monthBookings.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-[#047857]/10 flex items-center justify-center shrink-0">
                <CalendarIcon size={16} className="text-[#047857]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{b.customer || 'Customer'}</p>
                <p className="text-xs text-gray-400">{b.date} at {b.time}</p>
              </div>
              <StatusBadge status={b.status as BookingStatus} />
              <p className="font-semibold text-gray-900 text-sm shrink-0">{formatNGN(b.amount)}</p>
            </div>
          ))}
          {monthBookings.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No jobs scheduled this month.</p>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upcoming Jobs</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {upcoming.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{b.customer || 'Customer'}</p>
                <p className="text-xs text-gray-400">{b.date}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{b.time}</span>
              <StatusBadge status={b.status as BookingStatus} />
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No upcoming jobs.</p>
          )}
        </div>
      </div>
    </>
  )
}
