import PersonalInfoTab from './PersonalInfoTab'
import SecurityTab from './SecurityTab'
import PaymentMethodsTab from './PaymentMethodsTab'
import NotificationsTab from './NotificationsTab'
import type { AuthUser } from '@/types'

type SettingsTab = 'personal' | 'security' | 'payment' | 'notifications'

interface Props {
  activeTab: SettingsTab
  user: AuthUser | null
  name: string
  onNameChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  city: string
  onCityChange: (v: string) => void
  saving: boolean
  saved: boolean
  error: string
  onProfileSubmit: (e: React.FormEvent) => void
  uploading: boolean
  uploadError: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  currentPassword: string
  onCurrentPasswordChange: (v: string) => void
  newPassword: string
  onNewPasswordChange: (v: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (v: string) => void
  changingPassword: boolean
  passwordMessage: string
  onPasswordSubmit: (e: React.FormEvent) => void
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

export default function TabContent(props: Props) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">
      {props.activeTab === 'personal' && (
        <PersonalInfoTab
          user={props.user}
          name={props.name}
          onNameChange={props.onNameChange}
          phone={props.phone}
          onPhoneChange={props.onPhoneChange}
          city={props.city}
          onCityChange={props.onCityChange}
          saving={props.saving}
          saved={props.saved}
          error={props.error}
          onSubmit={props.onProfileSubmit}
          uploading={props.uploading}
          uploadError={props.uploadError}
          onFileChange={props.onFileChange}
        />
      )}
      {props.activeTab === 'security' && (
        <SecurityTab
          currentPassword={props.currentPassword}
          onCurrentPasswordChange={props.onCurrentPasswordChange}
          newPassword={props.newPassword}
          onNewPasswordChange={props.onNewPasswordChange}
          confirmPassword={props.confirmPassword}
          onConfirmPasswordChange={props.onConfirmPasswordChange}
          changingPassword={props.changingPassword}
          passwordMessage={props.passwordMessage}
          onSubmit={props.onPasswordSubmit}
        />
      )}
      {props.activeTab === 'payment' && (
        <PaymentMethodsTab
          user={props.user}
          bankName={props.bankName}
          onBankNameChange={props.onBankNameChange}
          bankAccountNumber={props.bankAccountNumber}
          onBankAccountNumberChange={props.onBankAccountNumberChange}
          bankAccountName={props.bankAccountName}
          onBankAccountNameChange={props.onBankAccountNameChange}
          bankSaving={props.bankSaving}
          bankSaved={props.bankSaved}
          bankError={props.bankError}
          onBankSubmit={props.onBankSubmit}
        />
      )}
      {props.activeTab === 'notifications' && (
        <NotificationsTab />
      )}
    </div>
  )
}
