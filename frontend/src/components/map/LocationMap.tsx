'use client'

import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl bg-gray-100 animate-pulse" role="status">
      <span className="sr-only">Loading map…</span>
    </div>
  ),
})

export default function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="isolate">
      <MapView lat={lat} lng={lng} interactive={false} />
    </div>
  )
}
