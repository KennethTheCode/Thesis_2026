import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getMapFacilities } from '../Admin/ManageFacilities/Facilityapi'
import { FACILITY_TYPES, typeInfo } from '../Admin/ManageFacilities/Facilityoptions'

// Fix default Leaflet icon assets bug in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Dynamically generate round colored pins per facility type
const iconCache = {}
function facilityIcon(type) {
  if (!iconCache[type]) {
    const { color, icon } = typeInfo(type)
    iconCache[type] = L.divIcon({
      className: '',
      html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;">
               <span class="material-symbols-outlined" style="font-size:18px;color:white;">${icon}</span>
             </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    })
  }
  return iconCache[type]
}

// Auto-adjust Leaflet canvas size when parent containers resize
function ResizeMap() {
  const map = useMap()
  useEffect(() => {
    const invalidate = () => map.invalidateSize()
    invalidate()
    const parent = map.getContainer().parentElement
    if (!parent) return undefined
    const observer = new ResizeObserver(() => invalidate())
    observer.observe(parent)
    return () => observer.disconnect()
  }, [map])
  return null
}

function UserMap({ refreshKey = 0 }) {
  const mapWrapperRef = useRef(null)
  const centerCoordinates = [14.3323, 121.082] // Biñan City Center Coordinates
  const [facilities, setFacilities] = useState([])
  const [error, setError] = useState('')

  // Fetch facilities from backend MongoDB on mount
  useEffect(() => {
    let ignore = false
    getMapFacilities()
      .then((data) => {
        if (!ignore) {
          setFacilities(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  return (
    <div className="flex flex-col w-full h-[calc(80vh-80px)] p-4 text-white  rounded-lg shadow-lg">
      <div className="mb-4">
        
      </div>

      {/* Leaflet Map Container */}
      <div
        ref={mapWrapperRef}
        className="w-full h-full rounded-lg overflow-hidden shadow-lg relative z-0 border border-zinc-700 "
      >
        <MapContainer
          center={centerCoordinates}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ResizeMap />

          {/* Render Active Facility Markers Only */}
          {facilities.map((facility) => (
            <Marker
              key={facility.id || facility._id}
              position={[facility.latitude, facility.longitude]}
              icon={facilityIcon(facility.facility_type)}
            >
              <Popup>
                <div className="text-neutral-900 text-xs p-1">
                  <h4 className="font-bold text-sm text-red-600 mb-1">{facility.name}</h4>
                  <p><strong>Type:</strong> {typeInfo(facility.facility_type).label}</p>
                  <p><strong>Address:</strong> {facility.address}</p>
                  <p><strong>Barangay:</strong> {facility.barangay}</p>
                  <p><strong>Contact:</strong> {facility.contact_number}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Facility Types Color Legend Overlay */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded p-2 text-xs text-zinc-300 flex flex-col gap-1">
          {FACILITY_TYPES.map((t) => (
            <div key={t.value} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: t.color }} />
              {t.label}
            </div>
          ))}
        </div>

        {/* Error Notification Overlay */}
        {error && (
          <p className="absolute top-2 right-2 z-[1000] text-red-400 text-xs border border-red-500/30 bg-zinc-900/90 rounded p-2">
            Map Error: {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default UserMap