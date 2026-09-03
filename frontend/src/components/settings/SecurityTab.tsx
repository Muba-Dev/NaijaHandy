import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  currentPassword: string
  onCurrentPasswordChange: (v: string) => void
  newPassword: string
  onNewPasswordChange: (v: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (v: string) => void
  changingPassword: boolean
  passwordMessage: string
  onSubmit: (e: React.FormEvent) => void
}

export default function SecurityTab({
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  changingPassword,
  passwordMessage,
  onSubmit,
}: Props) {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-5">Security & Password</h2>
      <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
        {[
          { label: 'Current Password', value: currentPassword, setter: onCurrentPasswordChange, key: 'current' },
          { label: 'New Password', value: newPassword, setter: onNewPasswordChange, key: 'new' },
          { label: 'Confirm New Password', value: confirmPassword, setter: onConfirmPasswordChange, key: 'confirm' },
        ].map((f) => (
          <div key={f.key}>
            <label htmlFor={`password-${f.key}`} className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input
              id={`password-${f.key}`}
              type="password"
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
            />
          </div>
        ))}
        {passwordMessage && (
          passwordMessage === 'updated' ? (
            <div role="status" className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
              <CheckCircle2 size={16} aria-hidden="true" /> Password updated. You may need to log in again on other devices.
            </div>
          ) : (
            <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={16} aria-hidden="true" /> {passwordMessage}
            </div>
          )
        )}
        <button
          type="submit"
          disabled={changingPassword}
          className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {changingPassword ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
