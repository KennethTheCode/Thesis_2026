export const STATUS_BADGE = {
  pending: { label: 'Pending', style: 'bg-orange-400/20 text-orange-400' },
  verified: { label: 'Verified', style: 'bg-blue-400/20 text-blue-400' },
  dispatched: { label: 'Dispatched', style: 'bg-purple-400/20 text-purple-400' },
  resolved: { label: 'Resolved', style: 'bg-green-400/20 text-green-400' },
  rejected: { label: 'Rejected', style: 'bg-red-400/20 text-red-400' },
}

export function formatIncident(inc, isNewLive = false) {
  if (!inc) return null

  const rawStatus = (inc.status || 'pending').toLowerCase()
  const badge = STATUS_BADGE[rawStatus] || STATUS_BADGE.pending

  // Safely resolve coordinates from either flat fields or GeoJSON location.coordinates [lon, lat]
  const latitude = Number(inc.latitude ?? inc.location?.coordinates?.[1]) || null
  const longitude = Number(inc.longitude ?? inc.location?.coordinates?.[0]) || null

  // Support both snake_case (MongoDB created_at) and camelCase (createdAt)
  const rawTimestamp = inc.created_at || inc.createdAt
  const parsedDate = rawTimestamp ? new Date(rawTimestamp) : null
  const formattedTime =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now'

  const barangay = inc.barangay || 'Unknown Barangay'
  const incidentType = inc.incident_type || 'SOS'

  return {
    id: inc.id || inc._id || inc.reference_no,
    reference_no: inc.reference_no,
    incident_type: incidentType,
    title: `${incidentType} (${inc.contact_number || 'Citizen'})`,
    locationName: `${barangay} (${inc.email || 'No email'})`,
    email: inc.email || 'N/A',
    contact_number: inc.contact_number || 'N/A',
    barangay,
    latitude,
    longitude,
    voicemail_file_id: inc.voicemail_file_id || null,
    time: formattedTime,
    status: rawStatus,
    rawStatus,
    statusLabel: badge.label,
    statusBg: isNewLive ? 'bg-red-500/20 text-red-400 animate-pulse' : badge.style,
  }
}