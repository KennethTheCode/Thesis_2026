import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getMapFacilities } from './ManageFacilities/facilityApi'
import { getMapIncidents } from './Incidents/IncidentApi.js'
import { FACILITY_TYPES, typeInfo } from '../Admin/ManageFacilities/Facilityoptions'
import { useOptionalIncidents } from './context/IncidentContext.jsx'
import { formatIncident } from './incidentHelpers.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const BINAN_DEFAULT_CENTER = [14.3323, 121.082]

const blinkingSOSIcon = L.divIcon({
  className: 'custom-blinking-sos-icon',
  html: `
    <style>
      @keyframes pulse-ring {
        0% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1.4); opacity: 0.2; }
        100% { transform: scale(0.95); opacity: 0.8; }
      }
      .sos-dot {
        background-color: #ef4444;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
        position: relative;
      }
      .sos-pulse {
        position: absolute;
        top: -4px; left: -4px;
        width: 24px; height: 24px;
        border-radius: 50%;
        background-color: #ef4444;
        animation: pulse-ring 1.2s infinite ease-in-out;
      }
    </style>
    <div class="sos-pulse"></div>
    <div class="sos-dot"></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

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

function getCoords(inc) {
  if (!inc) return null
  const lat = Number(inc.latitude ?? inc.location?.coordinates?.[1])
  const lon = Number(inc.longitude ?? inc.location?.coordinates?.[0])
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    return null
  }
  return [lat, lon]
}

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

function MapViewportController({ focusIncident, latestAlert, onAlertHandled }) {
  const map = useMap()

  // Recenter only when focusIncident target changes (e.g., inside IncidentDetailsModal)
  useEffect(() => {
    const coords = getCoords(focusIncident)
    if (coords) {
      map.setView(coords, 16)
    }
  }, [focusIncident?.reference_no, focusIncident?.latitude, focusIncident?.longitude, map])

  // Smoothly fly to incoming emergency SOS on the main dispatch map
  useEffect(() => {
    if (focusIncident || !latestAlert) return
    const coords = getCoords(latestAlert)
    if (coords) {
      map.flyTo(coords, 16, { duration: 0.8 })
    }
    onAlertHandled?.()
  }, [latestAlert, focusIncident, onAlertHandled, map])

  return null
}

function AdminMap({ showFacilities = true, focusIncident = null, refreshKey = 0 }) {
  const mapWrapperRef = useRef(null)
  const [facilities, setFacilities] = useState([])
  const [fallbackIncidents, setFallbackIncidents] = useState([])
  const [error, setError] = useState('')

  // Read from shared IncidentContext if mounted inside <IncidentProvider>
  const incidentCtx = useOptionalIncidents()
  const hasContext = Boolean(incidentCtx)

  const latestAlert = incidentCtx?.latestAlert || null
  const clearLatestAlert = incidentCtx?.clearLatestAlert
  const syncIncidents = incidentCtx?.syncIncidents

  // Fallback fetch ONLY if AdminMap is mounted outside <IncidentProvider>
  useEffect(() => {
    if (hasContext || focusIncident) return
    let ignore = false
    getMapIncidents()
      .then((data) => {
        if (!ignore) setFallbackIncidents(data.map((inc) => formatIncident(inc)))
      })
      .catch((err) => console.error('Error loading incidents:', err))
    return () => {
      ignore = true
    }
  }, [hasContext, focusIncident, refreshKey])

  // Respect manual refreshKey prop when inside <IncidentProvider>
  useEffect(() => {
    if (hasContext && refreshKey > 0 && !focusIncident) {
      syncIncidents?.()
    }
  }, [hasContext, refreshKey, focusIncident, syncIncidents])

  const liveIncidents = hasContext ? incidentCtx.incidents : fallbackIncidents
  const initialCenter = getCoords(focusIncident) || BINAN_DEFAULT_CENTER
  const activeIncidents = focusIncident ? [focusIncident] : liveIncidents

  // Fetch facilities ONLY if showFacilities is true
  useEffect(() => {
    if (!showFacilities) return
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
  }, [showFacilities, refreshKey])

  return (
    <div
      ref={mapWrapperRef}
      className="relative w-full h-full min-h-[220px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-10"
    >
      <MapContainer
        center={initialCenter}
        zoom={15}
        scrollWheelZoom={true}
        className="h-full w-full min-h-[220px]"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ResizeMap />
        <MapViewportController
          focusIncident={focusIncident}
          latestAlert={latestAlert}
          onAlertHandled={clearLatestAlert}
        />

        {/* Render SOS Incident Marker(s) */}
        {activeIncidents.map((inc) => {
          const coords = getCoords(inc)
          if (!coords) return null

          return (
            <Marker
              key={inc.id || inc.reference_no}
              position={coords}
              icon={blinkingSOSIcon}
            >
              <Popup>
                <div className="text-neutral-900 text-xs p-1 space-y-1">
                  <h4 className="font-bold text-sm text-red-600">EMERGENCY SOS</h4>
                  <p><strong>Ref:</strong> {inc.reference_no}</p>
                  <p><strong>Type:</strong> {inc.incident_type || inc.title || 'SOS'}</p>
                  <p><strong>Email:</strong> {inc.email || 'N/A'}</p>
                  <p><strong>Contact:</strong> {inc.contact_number || 'N/A'}</p>
                  <p><strong>Barangay:</strong> {inc.barangay}</p>
                  <p><strong>Status:</strong> {inc.statusLabel || inc.status}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Render Facilities ONLY when showFacilities is true */}
        {showFacilities &&
          facilities.map((facility) => (
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