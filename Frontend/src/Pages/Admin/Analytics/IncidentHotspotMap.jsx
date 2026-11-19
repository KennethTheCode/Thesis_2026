import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { INCIDENT_TYPE_OPTIONS, MONTH_OPTIONS, YEAR_OPTIONS } from '../Incidents/incidentCsvParser.js'
import GetisOrdHotspotMap from './GetisOrdHotspotMap.jsx'
import { getIncidentHotspots, getIncidentWSUrl } from './SpatialAnalysisApi.js'

const BINAN_CENTER = [14.3165, 121.0765]

const RISK_STYLE = {
  high: {
    color: '#ef4444',
    fillColor: '#ef4444',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: 'High Risk',
  },
  moderate: {
    color: '#f59e0b',
    fillColor: '#f59e0b',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    label: 'Moderate Risk',
  },
  low: {
    color: '#10b981',
    fillColor: '#10b981',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    label: 'Low Risk',
  },
}

function FlyToBarangay({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target && target.latitude && target.longitude) {
      map.flyTo([target.latitude, target.longitude], 15, { duration: 0.8 })
    }
  }, [target, map])
  return null
}

function IncidentHotspotMap() {
  const [analysisMode, setAnalysisMode] = useState('kmeans') // 'kmeans' | 'getis'
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBarangay, setSelectedBarangay] = useState(null)

  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const loadHotspots = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getIncidentHotspots({
        year: yearFilter,
        month: monthFilter,
        incidentType: typeFilter,
        status: 'resolved',
      })
      setHotspots(data)
    } catch (err) {
      setError(err.message || 'Failed to load geospatial hotspot data.')
    } finally {
      setLoading(false)
    }
  }, [yearFilter, monthFilter, typeFilter])

  useEffect(() => {
    if (analysisMode === 'kmeans') {
      loadHotspots()
    }
  }, [analysisMode, loadHotspots])

  // Auto-refresh map when a live SOS incident is resolved
  useEffect(() => {
    const ws = new WebSocket(getIncidentWSUrl())
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.event === 'INCIDENT_STATUS_UPDATED' && payload.data?.status === 'resolved') {
          loadHotspots()
        }
      } catch (err) {
        console.error('Hotspot map WS error:', err)
      }
    }
    return () => ws.close()
  }, [loadHotspots])

  const { totalIncidents, maxCount } = useMemo(() => {
    const total = hotspots.reduce((sum, item) => sum + item.total_incidents, 0)
    const max = hotspots.length > 0 ? hotspots[0].total_incidents : 1
    return { totalIncidents: total, maxCount: max }
  }, [hotspots])

  const getRadius = (count) => {
    const normalized = Math.sqrt(count / maxCount)
    return Math.round(10 + normalized * 24)
  }

  const modeToggle = (
    <div className="inline-flex rounded bg-zinc-800 p-0.5 border border-zinc-700 text-[11px]">
      <button
        type="button"
        onClick={() => setAnalysisMode('kmeans')}
        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
          analysisMode === 'kmeans'
            ? 'bg-zinc-700 text-white font-semibold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Risk Levels
      </button>
      <button
        type="button"
        onClick={() => setAnalysisMode('getis')}
        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
          analysisMode === 'getis'
            ? 'bg-zinc-700 text-white font-semibold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Clustered Danger Zones
      </button>
    </div>
  )

  if (analysisMode === 'getis') {
    return <GetisOrdHotspotMap modeToggle={modeToggle} />
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded w-full p-3 flex flex-col gap-3 text-white">
      {/* Header & Filters */}
      <div className="flex flex-wrap justify-between items-center border-b border-zinc-800 pb-2.5 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-white">
            Biñan City Incident Risk Map (1D K-Means)
          </h2>
          {modeToggle}
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-semibold">
            {totalIncidents.toLocaleString()} Total Incidents
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Incident Types</option>
            {INCIDENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Years</option>
            {YEAR_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Months</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadHotspots}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-200 cursor-pointer transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs border border-red-500/30 bg-red-500/10 rounded px-2.5 py-1.5">
          {error}
        </p>
      )}

      {/* Map + Ranked Risk Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[58vh]">
        <div className="lg:col-span-2 rounded border border-zinc-800 overflow-hidden relative z-0">
          <MapContainer
            center={BINAN_CENTER}
            zoom={13}
            className="w-full h-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyToBarangay target={selectedBarangay} />

            {hotspots.map((spot) => {
              const style = RISK_STYLE[spot.risk_level] || RISK_STYLE.low
              return (
                <CircleMarker
                  key={spot.barangay}
                  center={[spot.latitude, spot.longitude]}
                  radius={getRadius(spot.total_incidents)}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fillColor,
                    fillOpacity: 0.45,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedBarangay(spot),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <span className="font-semibold">{spot.barangay}</span>: {spot.total_incidents}{' '}
                    incidents ({style.label})
                  </Tooltip>

                  <Popup>
                    <div className="text-zinc-900 text-xs space-y-1 min-w-[200px]">
                      <div className="font-bold text-sm">{spot.barangay}</div>
                      <div>
                        <span className="font-semibold">Risk Tier:</span> {spot.risk_label}
                      </div>
                      <div>
                        <span className="font-semibold">Total Incidents:</span>{' '}
                        {spot.total_incidents}
                      </div>
                      <div>
                        <span className="font-semibold">Cluster Mean (Centroid):</span>{' '}
                        {spot.cluster_centroid}
                      </div>
                      <div>
                        <span className="font-semibold">Primary Type:</span>{' '}
                        {spot.top_incident_type}
                      </div>
                      {spot.landmark_reference && (
                        <div className="text-zinc-600 text-[11px]">{spot.landmark_reference}</div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* K-Means Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded px-2.5 py-2 text-[11px] space-y-1">
            <div className="font-semibold text-zinc-300">K-Means Risk Clusters (k = 3)</div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>High Risk Cluster</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Moderate Risk Cluster</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Low Risk Cluster</span>
            </div>
          </div>
        </div>

        {/* Ranked Barangays Sidebar */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded p-2.5 flex flex-col gap-2 overflow-hidden">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
            <span className="text-xs font-bold text-zinc-200">Ranked Risk Areas</span>
            <span className="text-[11px] text-zinc-400">{hotspots.length} Barangays</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loading && (
              <p className="text-xs text-zinc-500 text-center py-8">
                Clustering barangays with 1D K-Means...
              </p>
            )}

            {!loading && hotspots.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-8">
                No incidents found in database for the selected filters.
              </p>
            )}

            {!loading &&
              hotspots.map((spot, idx) => {
                const style = RISK_STYLE[spot.risk_level] || RISK_STYLE.low
                const pct = totalIncidents
                  ? ((spot.total_incidents / totalIncidents) * 100).toFixed(1)
                  : '0.0'
                const isSelected = selectedBarangay?.barangay === spot.barangay

                return (
                  <button
                    key={spot.barangay}
                    type="button"
                    onClick={() => setSelectedBarangay(spot)}
                    className={`w-full text-left p-2 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 border-zinc-600'
                        : 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        #{idx + 1} {spot.barangay}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${style.badge}`}
                      >
                        {spot.total_incidents} ({pct}%)
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between items-center text-[11px] text-zinc-400">
                      <span>Top: {spot.top_incident_type}</span>
                      <span>{style.label}</span>
                    </div>

                    <div className="mt-1.5 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, (spot.total_incidents / maxCount) * 100)}%`,
                          backgroundColor: style.color,
                        }}
                      />
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentHotspotMap