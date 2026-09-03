import { Save, Loader2 } from 'lucide-react'
import MapPicker from '@/components/map/MapPicker'
import Alert from '@/components/ui/Alert'

interface LocationSectionProps {
  locationLat: number | null
  locationLng: number | null
  locationAddress: string
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  onAddressChange: (address: string) => void
  onSaveLocation: () => void
  savingLocation: boolean
  locationSaved: boolean
  locationError: string
}

export default function LocationSection({ locationLat, locationLng, locationAddress, onLocationSelect, onAddressChange, onSaveLocation, savingLocation, locationSaved, locationError }: LocationSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="font-semibold text-gray-900">Location</h2>
        <p className="text-xs text-gray-500">Shown on your public profile</p>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Set the address where you work so customers can find you. Search for a place or click the map to drop a pin.
      </p>
      <MapPicker
        lat={locationLat}
        lng={locationLng}
        address={locationAddress}
        onSelect={onLocationSelect}
        onAddressChange={onAddressChange}
      />
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onSaveLocation}
          disabled={savingLocation}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#047857] hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {savingLocation ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {savingLocation ? 'Saving…' : 'Save Location'}
        </button>
        {locationLat !== null && locationLng !== null && (
          <p className="text-xs text-gray-500">{locationLat.toFixed(5)}, {locationLng.toFixed(5)}</p>
        )}
      </div>
      {locationSaved && (
        <Alert className="mt-3">Location saved.</Alert>
      )}
      {locationError && (
        <Alert variant="error" className="mt-3">{locationError}</Alert>
      )}
    </div>
  )
}
