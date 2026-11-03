import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getMapFacilities } from './facilityApi'
import { FACILITY_TYPES, typeInfo } from './Facilityoptions.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const sampleIncidents = [
  {
    id: 1,
    title: 'Vehicular Collision',
    locationName: 'Plaza Rizal, Biñan',
    lat: 14.3323,
    lng: 121.082,
    severity: 'High',
    status: 'Responder Dispatched'
  },
  {
    id: 2,
    title: 'Motorcycle Slip',
    locationName: 'SLEX Biñan Exit',
    lat: 14.3215,
    lng: 121.0712,
    severity: 'Medium',
    status: 'Pending Verification'
  },
  {
    id: 3,
    title: 'Medical Assistance',
    locationName: 'Biñan Doctors Hospital',
    lat: 14.3382,
    lng: 121.0888,
    severity: 'Low',
    status: 'Unit En Route'
  }
]

// One round, colored pin per facility type (colors/icons are set in facilityOptions.js)
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

function ResizeMap() {
  const map = useMap()

  useEffect(() => {
    const invalidate = () => map.invalidateSize()

    invalidate()

    const parent = map.getContainer().parentElement
    if (!parent) return undefined

    const observer = new ResizeObserver(() => {
      invalidate()
    })

    observer.observe(parent)

    return () => observer.disconnect()
  }, [map])

  return null
}

// showFacilities: draw facility markers from the backend (used on Manage Facilities).
// refreshKey: change it to reload the markers.
function AdminMap({ showFacilities = false, refreshKey = 0 }) {
  const mapWrapperRef = useRef(null)
  const [facilities, setFacilities] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!showFacilities) return
    let ignore = false

    getMapFacilities()
      .then((data) => { if (!ignore) { setFacilities(data); setError('') } })
      .catch((err) => { if (!ignore) setError(err.message) })

    return () => { ignore = true }
  }, [showFacilities, refreshKey])

  return (
    <div
      ref={mapWrapperRef}
      className="relative w-full h-full min-h-[320px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-10"
    >
      <MapContainer
        center={[14.3323, 121.082]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full "
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ResizeMap />

        {/* Incident markers (dashboard) */}
        {!showFacilities && sampleIncidents.map((incident) => (
          <Marker key={incident.id} position={[incident.lat, incident.lng]}>
            <Popup>
              <div className="text-neutral-900 text-xs p-1">
                <h4 className="font-bold text-sm text-red-600 mb-1">{incident.title}</h4>
                <p><strong>Location:</strong> {incident.locationName}</p>
                <p><strong>Status:</strong> {incident.status}</p>
                <p><strong>Severity:</strong> {incident.severity}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Facility markers (manage facilities) */}
        {showFacilities && facilities.map((facility) => (
          <Marker
            key={facility.id}
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

      {/* Legend */}
      {showFacilities && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded p-2 text-xs text-zinc-300 flex flex-col gap-1">
          {FACILITY_TYPES.map((t) => (
            <div key={t.value} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: t.color }} />
              {t.label}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="absolute top-2 right-2 z-[1000] text-red-400 text-xs border border-red-500/30 bg-zinc-900/90 rounded p-2">
          Map: {error}
        </p>
      )}
    </div>
  )
}

export default AdminMap