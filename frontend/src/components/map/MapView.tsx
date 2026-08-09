'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27C30 6.7 23.3 0 15 0z" fill="#047857" stroke="#065f46" stroke-width="1.5"/><circle cx="15" cy="15" r="6" fill="white"/></svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
})

function ClickHandler({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onSelect) onSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function DecorativeTiles() {
  const map = useMap()
  useEffect(() => {
    const mark = (e: { tile?: HTMLImageElement }) => {
      if (e.tile) e.tile.setAttribute('alt', '')
    }
    const markExisting = () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer && layer.getContainer()) {
          layer.getContainer().querySelectorAll('img').forEach((img) => img.setAttribute('alt', ''))
        }
      })
    }
    map.on('tileload', mark)
    markExisting()
    const timer = window.setTimeout(markExisting, 500)
    return () => {
      map.off('tileload', mark)
      window.clearTimeout(timer)
    }
  }, [map])
  return null
}

export default function MapView({
  lat,
  lng,
  interactive = true,
  onSelect,
}: {
  lat: number
  lng: number
  interactive?: boolean
  onSelect?: (lat: number, lng: number) => void
}) {
  return (
    <div className="isolate">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        className="h-72 w-full rounded-xl z-0"
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <DecorativeTiles />
        <Marker position={[lat, lng]} icon={pinIcon} interactive={false} keyboard={false} />
        {interactive && <ClickHandler onSelect={onSelect} />}
      </MapContainer>
    </div>
  )
}
