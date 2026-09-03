import Link from 'next/link'
import { CreditCard, ShieldCheck } from 'lucide-react'
import type { AuthUser } from '@/types'

interface Props {
  user: AuthUser | null
  bankName: string
  onBankNameChange: (v: string) => void
  bankAccountNumber: string
  onBankAccountNumberChange: (v: string) => void
  bankAccountName: string
  onBankAccountNameChange: (v: string) => void
  bankSaving: boolean
  bankSaved: boolean
  bankError: string
  onBankSubmit: (e: React.FormEvent) => void
}

export default function PaymentMethodsTab({
  user,
  bankName,
  onBankNameChange,
  bankAccountNumber,
  onBankAccountNumberChange,
  bankAccountName,
  onBankAccountNameChange,
  bankSaving,
  bankSaved,
  bankError,
  onBankSubmit,
}: Props) {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-3">Payment Methods</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        Payments are processed securely by Paystack at checkout. NaijaHandy never stores your
        card or bank details on your account — choose a method each time you pay for a booking.
      </p>

      <div className="space-y-3 mb-5">
        {[
          { type: 'Card', detail: 'Visa, Mastercard and Verve cards' },
          { type: 'Bank Transfer', detail: 'Pay from any Nigerian bank account' },
          { type: 'USSD', detail: 'Pay with *737# or your bank\u2019s USSD code' },
        ].map((m) => (
          <div key={m.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{m.type}</p>
                <p className="text-xs text-gray-500">{m.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 bg-[#ECFDF5] border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-800 mb-6">
        <ShieldCheck size={16} className="shrink-0 mt-0.5 text-[#047857]" aria-hidden="true" />
        <p className="leading-relaxed">
          Your payment is held in escrow and only released to the artisan once you mark the job as
          completed. Read more about the{' '}
          <Link href="/guarantee" className="font-semibold text-[#047857] hover:underline">
            NaijaHandy Guarantee
          </Link>.
        </p>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-semibold text-gray-900 mb-1">
          {user?.role === 'ARTISAN' ? 'Payout Bank Details' : 'Saved Bank Account'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {user?.role === 'ARTISAN'
            ? 'Add your bank account details for receiving payouts when jobs are completed.'
            : 'Save a bank account for faster checkout in the future.'}
        </p>
        <form onSubmit={onBankSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <select
              value={bankName}
              onChange={(e) => onBankNameChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-[#047857] focus:bg-white focus:outline-none"
            >
              <option value="">Select your bank</option>
              <option>Access Bank</option>
              <option>Carbon (Formerly Paylater)</option>
              <option>Citibank Nigeria</option>
              <option>Ecobank Nigeria</option>
              <option>Fidelity Bank</option>
              <option>First Bank of Nigeria</option>
              <option>First City Monument Bank</option>
              <option>Globus Bank</option>
              <option>Guaranty Trust Bank</option>
              <option>Heritage Bank</option>
              <option>Keystone Bank</option>
              <option>Kuda Bank</option>
              <option>Paga</option>
              <option>Polaris Bank</option>
              <option>Providus Bank</option>
              <option>Sterling Bank</option>
              <option>TD Africa</option>
              <option>Titan Trust Bank</option>
              <option>Union Bank</option>
              <option>United Bank for Africa</option>
              <option>VFD Microfinance Bank</option>
              <option>Wema Bank</option>
              <option>Zenith Bank</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => onBankAccountNumberChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 1234567890"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#047857] focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => onBankAccountNameChange(e.target.value)}
              placeholder="e.g. Chisom Okonkwo"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#047857] focus:bg-white focus:outline-none"
            />
          </div>
          {bankError && <p className="text-sm text-red-600">{bankError}</p>}
          {bankSaved && <p className="text-sm text-emerald-600">Bank details saved successfully.</p>}
          <button
            type="submit"
            disabled={bankSaving || !bankName || !bankAccountNumber || !bankAccountName}
            className="rounded-xl bg-[#047857] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#065f46] disabled:opacity-50"
          >
            {bankSaving ? 'Saving…' : 'Save Bank Details'}
          </button>
        </form>
      </div>
    </div>
  )
}
