import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getMapFacilities } from '../Admin/ManageFacilities/facilityApi'
import { getIncidentWSUrl, getMapIncidents } from './Incidents/IncidentApi.js'
import { FACILITY_TYPES, typeInfo } from '../Admin/ManageFacilities/Facilityoptions'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 15)
    }
  }, [center, map])
  return null
}

function AdminMap({ showFacilities = true, focusIncident = null, refreshKey = 0 }) {
  const mapWrapperRef = useRef(null)
  const [facilities, setFacilities] = useState([])
  const [incidents, setIncidents] = useState([])
  const [error, setError] = useState('')

  // Determine initial center: Focus incident coordinates or Biñan center
  const centerCoords = focusIncident && focusIncident.latitude && focusIncident.longitude
    ? [focusIncident.latitude, focusIncident.longitude]
    : [14.3323, 121.082]

  // If focusIncident is provided, only render that specific incident
  const activeIncidents = focusIncident
    ? [focusIncident]
    : incidents

  // Fetch all map incidents if not focusing on a single one
  useEffect(() => {
    if (focusIncident) return
    getMapIncidents()
      .then((data) => setIncidents(data))
      .catch((err) => console.error('Error loading incidents:', err))
  }, [refreshKey, focusIncident])

  // Fetch facilities ONLY if showFacilities is true
  useEffect(() => {
    if (!showFacilities) return
    let ignore = false
    getMapFacilities()
      .then((data) => { if (!ignore) { setFacilities(data); setError('') } })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [showFacilities, refreshKey])

  // Listen for WebSockets if not in single-focus mode
  useEffect(() => {
    if (focusIncident) return
    const ws = new WebSocket(getIncidentWSUrl())
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.event === 'NEW_INCIDENT') {
          setIncidents((prev) => [payload.data, ...prev])
        }
      } catch (e) {
        console.error('WS parse error:', e)
      }
    }
    return () => ws.close()
  }, [focusIncident])

  return (
    <div ref={mapWrapperRef} className="relative w-full h-full min-h-[220px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-10">
      <MapContainer center={centerCoords} zoom={15} scrollWheelZoom={true} className="h-full w-full min-h-[220px]">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ResizeMap />
        <RecenterMap center={centerCoords} />

        {/* Render SOS Incident Marker(s) */}
        {activeIncidents.map((inc) => (
          inc.latitude && inc.longitude && (
            <Marker key={inc.id || inc.reference_no} position={[inc.latitude, inc.longitude]} icon={blinkingSOSIcon}>
              <Popup>
                <div className="text-neutral-900 text-xs p-1 space-y-1">
                  <h4 className="font-bold text-sm text-red-600">EMERGENCY SOS</h4>
                  <p><strong>Ref:</strong> {inc.reference_no}</p>
                  <p><strong>Email:</strong> {inc.email || 'N/A'}</p>
                  <p><strong>Contact:</strong> {inc.contact_number || 'N/A'}</p>
                  <p><strong>Barangay:</strong> {inc.barangay}</p>
                  <p><strong>Status:</strong> {inc.status}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Render Facilities ONLY when showFacilities is true */}
        {showFacilities && facilities.map((facility) => (
          <Marker key={facility.id} position={[facility.latitude, facility.longitude]} icon={facilityIcon(facility.facility_type)}>
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