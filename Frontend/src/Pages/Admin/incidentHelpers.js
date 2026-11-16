export const STATUS_BADGE = {
  pending: { label: 'Pending', style: 'bg-orange-400/20 text-orange-400' },
  verified: { label: 'Verified', style: 'bg-blue-400/20 text-blue-400' },
  dispatched: { label: 'Dispatched', style: 'bg-purple-400/20 text-purple-400' },
  resolved: { label: 'Resolved', style: 'bg-green-400/20 text-green-400' },
  rejected: { label: 'Rejected', style: 'bg-red-400/20 text-red-400' },
}

export function formatIncident(inc, isNewLive = false) {
  const rawStatus = inc.status || 'pending'
  const badge = STATUS_BADGE[rawStatus] || STATUS_BADGE.pending

  return {
    id: inc.id || inc.reference_no,
    reference_no: inc.reference_no,
    title: `SOS (${inc.contact_number || 'Citizen'})`,
    locationName: `${inc.barangay} (${inc.email || 'No email'})`,
    email: inc.email || 'N/A',
    contact_number: inc.contact_number || 'N/A',
    barangay: inc.barangay,
    latitude: inc.latitude,
    longitude: inc.longitude,
    voicemail_file_id: inc.voicemail_file_id || null,
    time: inc.createdAt
      ? new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    rawStatus,
    statusLabel: badge.label,
    statusBg: isNewLive ? 'bg-red-500/20 text-red-400 animate-pulse' : badge.style,
  }
}