import { Users, Shield, CreditCard, Bell } from 'lucide-react'

type SettingsTab = 'personal' | 'security' | 'payment' | 'notifications'

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

interface Props {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

export default function SettingsTabNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="w-full md:w-48 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-2 space-y-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              aria-pressed={activeTab === t.id}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'text-white bg-[#047857]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Icon size={15} aria-hidden="true" />{t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
