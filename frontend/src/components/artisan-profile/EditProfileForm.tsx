import { Save, Loader2 } from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import Alert from '@/components/ui/Alert'

type FormFields = { profession: string; category: string; bio: string; hourlyRate: string }

interface EditProfileFormProps {
  form: FormFields
  set: (k: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  available: boolean
  onToggleAvailable: () => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
  saved: boolean
  error: string
}

export default function EditProfileForm({ form, set, available, onToggleAvailable, onSubmit, saving, saved, error }: EditProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-5">Edit Profile</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1.5">Profession</label>
          <input
            id="profession"
            value={form.profession}
            onChange={set('profession')}
            placeholder="e.g. Master Plumber"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={set('category')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors text-gray-700"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={set('bio')}
          rows={4}
          placeholder="Tell customers about your experience and services…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors resize-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate (₦)</label>
        <input
          type="number"
          min={0}
          value={form.hourlyRate}
          onChange={set('hourlyRate')}
          placeholder="e.g. 8500"
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#047857] transition-colors"
        />
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-5">
        <div>
          <p className="text-sm font-medium text-gray-700" id="availability-switch-label">Available for Work</p>
          <p className="text-xs text-gray-500">Customers can only book you when this is on</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label="Available for work"
          aria-labelledby="availability-switch-label"
          onClick={onToggleAvailable}
          className={`relative w-11 h-6 rounded-full transition-colors ${available ? 'bg-[#047857]' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${available ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}
      {saved && (
        <Alert className="mb-4">Profile updated successfully.</Alert>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
