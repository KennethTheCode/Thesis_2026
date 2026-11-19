import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { INCIDENT_TYPE_OPTIONS, YEAR_OPTIONS } from '../Incidents/incidentCsvParser.js'
import { getGetisOrdHotspots, getIncidentWSUrl } from './SpatialAnalysisApi.js'

const BINAN_CENTER = [14.3165, 121.0765]

function getTierBadge(tier, zScore) {
  if (tier === 'hotspot') {
    return zScore >= 2.58
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }
  if (tier === 'coldspot') {
    return zScore <= -2.58
      ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
      : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
  }
  return 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40'
}

function FlyToCentroid({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target?.centroid?.lat && target?.centroid?.lon) {
      map.flyTo([target.centroid.lat, target.centroid.lon], 15, { duration: 0.8 })
    }
  }, [target, map])
  return null
}

function GetisOrdHotspotMap({ modeToggle }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBarangay, setSelectedBarangay] = useState(null)

  const [yearFilter, setYearFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [useNormalizedRate, setUseNormalizedRate] = useState(false)
  const [kNeighbors, setKNeighbors] = useState(3)
  const [statusFilter, setStatusFilter] = useState('pending_and_resolved')

  const loadGetisOrd = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getGetisOrdHotspots({
        year: yearFilter,
        incidentType: typeFilter,
        useNormalizedRate,
        kNeighbors,
        statusFilter,
      })
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load Getis-Ord Gi* spatial analysis.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [yearFilter, typeFilter, useNormalizedRate, kNeighbors, statusFilter])

  useEffect(() => {
    loadGetisOrd()
  }, [loadGetisOrd])

  useEffect(() => {
    const ws = new WebSocket(getIncidentWSUrl())
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (
          payload.event === 'INCIDENT_STATUS_UPDATED' ||
          payload.event === 'NEW_INCIDENT' ||
          payload.event === 'INCIDENT_CREATED'
        ) {
          loadGetisOrd()
        }
      } catch (err) {
        console.error('Getis-Ord map WS error:', err)
      }
    }
    return () => ws.close()
  }, [loadGetisOrd])

  const barangays = data?.barangays || []
  const summary = data?.summary || {
    hotspot_count: 0,
    coldspot_count: 0,
    not_significant_count: 24,
  }
  const totalRecords = data?.parameters?.total_records_analyzed || 0

  const maxAbsZ = useMemo(() => {
    if (barangays.length === 0) return 2.58
    return Math.max(2.58, ...barangays.map((b) => Math.abs(b.gi_z_score)))
  }, [barangays])

  const getRadius = (zScore) => {
    const normalized = Math.min(1, Math.abs(zScore) / maxAbsZ)
    return Math.round(10 + normalized * 20)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded w-full p-3 flex flex-col gap-3 text-white">
      {/* Header & Filters */}
      <div className="flex flex-wrap justify-between items-center border-b border-zinc-800 pb-2.5 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-white">
            Biñan City Spatial Hotspots (Getis-Ord Gi*)
          </h2>
          {modeToggle}
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-semibold">
            {summary.hotspot_count} Hotspots
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-semibold">
            {summary.coldspot_count} Coldspots
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter tickets included in the spatial hotspot calculation"
            className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="pending_and_resolved">Pending + Resolved</option>
            <option value="pending">Pending Only (Live SOS)</option>
            <option value="resolved">Resolved Only</option>
            <option value="all">All Statuses</option>
          </select>

          <select
            value={useNormalizedRate ? 'rate' : 'raw'}
            onChange={(e) => setUseNormalizedRate(e.target.value === 'rate')}
            className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="raw">Raw Incident Count</option>
            <option value="rate">Rate / 10k Residents (PSA)</option>
          </select>

          <select
            value={kNeighbors}
            onChange={(e) => setKNeighbors(Number(e.target.value))}
            title="Number of nearest neighboring barangays included in each local cluster window"
            className="bg-zinc-800/70 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value={2}>k = 2 Neighbors</option>
            <option value={3}>k = 3 Neighbors</option>
            <option value={4}>k = 4 Neighbors</option>
          </select>

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

          <button
            type="button"
            onClick={loadGetisOrd}
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

      {/* Map + Ranked Z-Score Sidebar */}
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

            <FlyToCentroid target={selectedBarangay} />

            {barangays.map((b) => (
              <CircleMarker
                key={b.barangay}
                center={[b.centroid.lat, b.centroid.lon]}
                radius={getRadius(b.gi_z_score)}
                pathOptions={{
                  color: b.color,
                  fillColor: b.color,
                  fillOpacity: b.tier === 'neutral' ? 0.3 : 0.55,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => setSelectedBarangay(b),
                }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <span className="font-semibold">{b.barangay}</span>: z ={' '}
                  {b.gi_z_score.toFixed(2)} ({b.classification})
                </Tooltip>

                <Popup>
                  <div className="text-zinc-900 text-xs space-y-1 min-w-[215px]">
                    <div className="font-bold text-sm">{b.barangay}</div>
                    <div>
                      <span className="font-semibold">Classification:</span> {b.classification}
                    </div>
                    <div>
                      <span className="font-semibold">Gi* Z-Score:</span>{' '}
                      {b.gi_z_score.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-semibold">p-Value (999 perm.):</span>{' '}
                      {b.p_value.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-semibold">Incidents:</span> {b.incident_count} (
                      {b.incident_rate_per_10k} / 10k pop.)
                    </div>
                    <div className="text-zinc-600 text-[11px]">
                      2020 PSA Pop.: {b.population_2020.toLocaleString()}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Getis-Ord Gi* Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded px-2.5 py-2 text-[11px] space-y-1">
            <div className="font-semibold text-zinc-300">
              Getis-Ord Gi* Significance (KNN k={kNeighbors})
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block" />
              <span>Hotspot — 99% Conf. (z ≥ 2.58)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] inline-block" />
              <span>Hotspot — 95% Conf. (z &gt; 1.96)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] inline-block" />
              <span>Not Statistically Significant</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] inline-block" />
              <span>Coldspot — 95% Conf. (z &lt; -1.96)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8] inline-block" />
              <span>Coldspot — 99% Conf. (z ≤ -2.58)</span>
            </div>
          </div>
        </div>

        {/* Ranked Z-Score Sidebar */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded p-2.5 flex flex-col gap-2 overflow-hidden">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
            <span className="text-xs font-bold text-zinc-200">Spatial Cluster Ranking</span>
            <span className="text-[11px] text-zinc-400">
              {totalRecords.toLocaleString()} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loading && (
              <p className="text-xs text-zinc-500 text-center py-8">
                Computing Getis-Ord Gi* (999 permutations)...
              </p>
            )}

            {!loading && barangays.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-8">
                No spatial cluster data available for the selected filters.
              </p>
            )}

            {!loading &&
              barangays.map((b, idx) => {
                const badgeClass = getTierBadge(b.tier, b.gi_z_score)
                const isSelected = selectedBarangay?.barangay === b.barangay

                return (
                  <button
                    key={b.barangay}
                    type="button"
                    onClick={() => setSelectedBarangay(b)}
                    className={`w-full text-left p-2 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 border-zinc-600'
                        : 'bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        #{idx + 1} {b.barangay}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${badgeClass}`}
                      >
                        z ={' '}
                        {b.gi_z_score >= 0
                          ? `+${b.gi_z_score.toFixed(2)}`
                          : b.gi_z_score.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between items-center text-[11px] text-zinc-400">
                      <span>
                        {b.incident_count} inc. ({b.incident_rate_per_10k}/10k)
                      </span>
                      <span>p = {b.p_value.toFixed(3)}</span>
                    </div>

                    <div className="mt-1 text-[10px] text-zinc-400 truncate">
                      {b.classification}
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

export default GetisOrdHotspotMap