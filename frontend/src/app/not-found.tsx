import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="relative mb-8 mx-auto w-40 h-40">
          <div className="w-40 h-40 rounded-full flex items-center justify-center bg-[#ECFDF5]">
            <AlertTriangle size={64} className="text-[#047857]" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-gray-900 font-bold text-sm">?</span>
          </div>
        </div>
        <p className="font-display text-7xl font-bold mb-4 text-[#047857]">404</p>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Looks like this page took the day off. Even our best artisans need a break sometimes.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold bg-[#047857] hover:opacity-90 transition-opacity"
        >
          <Home size={18} aria-hidden="true" /> Back to Home Page
        </Link>
      </div>
    </div>
  )
}
