import Link from 'next/link'
import { ShieldCheck, CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react'

const COVERED = [
  'Paid bookings completed through NaijaHandy checkout.',
  'The job not being done as described or agreed.',
  'Clear overcharging compared with the estimate you approved.',
  'A no-show by the artisan after payment — you get a full refund.',
  'Poor workmanship within reason, judged against what was agreed.',
]

const NOT_COVERED = [
  'Payments made off-platform (cash to the artisan, transfers outside checkout, etc.).',
  'Claims raised more than 14 days after the job date.',
  'Changes you agreed to with the artisan after booking.',
  'Damage or issues caused by the customer or a third party.',
]

const STEPS = [
  {
    title: 'Talk to the artisan first',
    body: 'Message or call them to explain the issue. Most problems are resolved quickly this way.',
  },
  {
    title: 'Raise a dispute from your booking',
    body: 'Within 14 days of the job date, open your booking and choose "Raise Dispute". Tell us what went wrong and attach any photos or evidence.',
  },
  {
    title: 'We review and make it right',
    body: 'Our team investigates both sides. If the claim is upheld, we refund the amount you paid through NaijaHandy or arrange a rework.',
  },
]

export default function GuaranteePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="bg-[#047857] rounded-3xl px-6 sm:px-12 py-12 text-white">
          <div className="flex items-center gap-2 text-emerald-100 text-sm font-semibold mb-3">
            <ShieldCheck size={18} aria-hidden="true" /> The NaijaHandy Guarantee
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold max-w-xl">Book with confidence.</h1>
          <p className="mt-3 text-emerald-50 max-w-xl leading-relaxed">
            Paid bookings on NaijaHandy are protected. If a job isn&apos;t done right, we work to make it right — a refund or a
            rework, based on the evidence.
          </p>
          <div className="flex gap-3 mt-7 flex-wrap">
            <Link href="/bookings" className="inline-flex items-center gap-2 bg-white text-[#047857] font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Review your bookings <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/help" className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
              Contact support
            </Link>
          </div>
        </div>

        {/* Coverage grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#047857]" aria-hidden="true" /> What&apos;s covered
            </h2>
            <ul className="mt-4 space-y-3">
              {COVERED.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <CheckCircle2 size={16} className="text-[#047857] shrink-0 mt-0.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle size={18} className="text-red-500" aria-hidden="true" /> What&apos;s not covered
            </h2>
            <ul className="mt-4 space-y-3">
              {NOT_COVERED.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-[#047857]" aria-hidden="true" /> How to claim
            </h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-50 text-[#047857] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 text-sm">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600 leading-relaxed list-disc list-inside">
            <li>The guarantee applies to amounts paid through NaijaHandy checkout — keep payments on the platform.</li>
            <li>Claims must be raised within <strong>14 days</strong> of the job date from your Bookings page.</li>
            <li>Eligibility is reviewed per claim based on the evidence from both sides.</li>
            <li>Keep messages and photos from the job — they help us decide faster.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
