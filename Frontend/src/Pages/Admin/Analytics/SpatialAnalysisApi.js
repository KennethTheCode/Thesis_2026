import { getIncidentHotspots, getIncidentWSUrl } from '../Incidents/IncidentApi.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export { getIncidentHotspots, getIncidentWSUrl }

export async function getGetisOrdHotspots({
  year = 'all',
  incidentType = 'all',
  useNormalizedRate = false,
  kNeighbors = 3,
  statusFilter = 'pending_and_resolved',
} = {}) {
  const params = new URLSearchParams()

  if (incidentType && incidentType !== 'all') {
    params.append('incident_type', incidentType)
  }
  if (year && year !== 'all') {
    params.append('year', String(year))
  }

  params.append('use_normalized_rate', String(useNormalizedRate))
  params.append('k_neighbors', String(kNeighbors))
  params.append('status_filter', statusFilter)

  const response = await fetch(
    `${API_BASE_URL}/analytics/getis-ord/hotspots?${params.toString()}`
  )

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    throw new Error(
      errBody.detail || `Failed to compute Getis-Ord Gi* (${response.status})`
    )
  }

  return response.json()
}