import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function BackToDashboard({ href = '/dashboard/customer' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#047857] transition-colors mb-4"
    >
      <ArrowLeft size={16} aria-hidden="true" /> Back to Dashboard
    </Link>
  )
}
