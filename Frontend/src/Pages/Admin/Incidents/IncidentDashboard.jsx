import React, { useCallback, useEffect, useState } from 'react'
import { getIncidentWSUrl } from '../Incidents/IncidentApi.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function IncidentDashboard({ onCardClick }) {
  const [stats, setStats] = useState({
    active_incidents: 0,
    verification_requests: 0,
    incomplete_records: 0,
    resolved_incidents: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard-summary`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  // Auto-refresh when new SOS tickets arrive or statuses change
  useEffect(() => {
    const ws = new WebSocket(getIncidentWSUrl())
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (
          payload.event === 'NEW_INCIDENT' ||
          payload.event === 'INCIDENT_CREATED' ||
          payload.event === 'INCIDENT_STATUS_UPDATED' ||
          payload.event === 'USER_VERIFICATION_UPDATED'
        ) {
          loadSummary()
        }
      } catch (err) {
        console.error('Dashboard WS error:', err)
      }
    }
    return () => ws.close()
  }, [loadSummary])

  const cards = [
    {
      key: 'active',
      label: 'Active Incidents',
      sublabel: 'Pending SOS & ongoing response',
      value: stats.active_incidents,
      accent: 'text-amber-500',
    },
    {
      key: 'verification',
      label: 'Verification Requests',
      sublabel: 'Awaiting user credential review',
      value: stats.verification_requests,
      accent: 'text-amber-400',
    },
    {
      key: 'incomplete',
      label: 'Incomplete Records',
      sublabel: 'Missing barangay, landmark, or GPS',
      value: stats.incomplete_records,
      accent: 'text-amber-500',
    },
    {
      key: 'resolved',
      label: 'Resolved Incidents',
      sublabel: 'Closed & verified cases',
      value: stats.resolved_incidents.toLocaleString(),
      accent: 'text-amber-400',
    },
  ]

  return (
    <div className="w-full p-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          onClick={() => onCardClick?.(card.key)}
          className={`flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 p-4 w-full rounded transition-colors ${
            onCardClick ? 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/60' : ''
          }`}
        >
          <h2 className="text-sm font-semibold text-zinc-200">{card.label}</h2>
          <p className={`text-3xl font-bold mt-1 ${card.accent}`}>
            {loading ? '—' : card.value}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 text-center">
            {card.sublabel}
          </span>
        </div>
      ))}
    </div>
  )
}

export default IncidentDashboard