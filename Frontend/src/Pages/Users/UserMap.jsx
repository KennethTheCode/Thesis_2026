import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default Leaflet icon assets bug in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Sample ResQ Emergency Incidents in Biñan City
const INITIAL_INCIDENTS = [
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
  }
]

// Component to catch user click events and place new emergency markers
function LocationMarker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

function UserMap() {
  // Biñan City Center Coordinates
  const centerCoordinates = [14.3323, 121.082]
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS)
  const [selectedPoint, setSelectedPoint] = useState(null)

  // Handle user clicking anywhere on the map to mark a location
  const handleMapClick = (latlng) => {
    setSelectedPoint(latlng)
  }

  const handleReportHere = () => {
    if (!selectedPoint) return
    const newReport = {
      id: Date.now(),
      title: 'Reported Accident Location',
      locationName: 'User Selected Pin',
      lat: selectedPoint.lat,
      lng: selectedPoint.lng,
      severity: 'Pending',
      status: 'Newly Reported'
    }
    setIncidents((prev) => [...prev, newReport])
    setSelectedPoint(null)
  }

  return (
    <div className="flex flex-col w-full h-[calc(80vh-80px)] p-4 text-white bg-zinc-900  rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">ResQ:Biñan Emergency Map</h2>
          <p className="text-xs text-gray-400">
            Interactive map displaying real-time incidents around Biñan City, Laguna.
          </p>
        </div>

        {selectedPoint && (
          <div className="flex items-center gap-3 bg-zinc-800  p-2 rounded">
            <span className="text-xs text-gray-300">
              Selected: <strong className="text-red-400">{selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}</strong>
            </span>
            <button
              onClick={handleReportHere}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
            >
              Report Emergency Here
            </button>
          </div>
        )}
      </div>

      {/* Leaflet Interactive Map Container */}
      <div className="w-full h-full rounded-lg overflow-hidden  shadow-lg relative z-0">
        <MapContainer
          center={centerCoordinates}
          zoom={14}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker onMapClick={handleMapClick} />

          {/* Render Active Emergency Incidents */}
          {incidents.map((incident) => (
            <Marker key={incident.id} position={[incident.lat, incident.lng]}>
              <Popup>
                <div className="text-neutral-900 text-xs p-1">
                  <h4 className="font-bold text-sm text-red-600 mb-1">{incident.title}</h4>
                  <p><strong>Location:</strong> {incident.locationName}</p>
                  <p><strong>Status:</strong> {incident.status}</p>
                  <p><strong>Severity:</strong> {incident.severity}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Coordinates: {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render temporary clicked pin */}
          {selectedPoint && (
            <Marker position={[selectedPoint.lat, selectedPoint.lng]}>
              <Popup>
                <div className="text-neutral-900 text-xs">
                  <p className="font-bold">Selected Emergency Location</p>
                  <p>Click "Report Emergency Here" above to trigger an alert.</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  )
}

export default UserMap