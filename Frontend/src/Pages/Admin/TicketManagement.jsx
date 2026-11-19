import React, { useEffect, useState, useCallback } from 'react'
import { getIncidentWSUrl, getMapIncidents, updateIncidentStatus } from './Incidents/IncidentApi.js'
import { STATUS_BADGE, formatIncident } from './incidentHelpers.js'
import IncidentTicketItem from './IncidentTicketItem.jsx'
import IncidentDetailsModal from './IncidentDetailsModal.jsx'

function TicketManagement() {
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadTickets = useCallback(async () => {
    try {
      const data = await getMapIncidents()
      setIncidents(data.map((inc) => formatIncident(inc)))
    } catch (err) {
      console.error('Failed to load tickets:', err)
    }
  }, [])

  // 1. Fetch initial active incidents
  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // 2. Real-time WebSocket sync with auto-reconnect & authoritative refresh
  useEffect(() => {
    let ws
    let reconnectTimer
    let isUnmounted = false

    const connectWS = () => {
      ws = new WebSocket(getIncidentWSUrl())

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)

          if (payload.event === 'NEW_INCIDENT' || payload.event === 'INCIDENT_CREATED') {
            if (payload.data) {
              const newItem = formatIncident(payload.data, true)
              setIncidents((prev) =>
                prev.some((item) => item.reference_no === newItem.reference_no)
                  ? prev
                  : [newItem, ...prev]
              )
            }
            // Re-fetch from API so all fields/IDs match getMapIncidents()
            loadTickets()
          }

          if (payload.event === 'INCIDENT_STATUS_UPDATED') {
            const { reference_no, status } = payload.data || {}
            const isTerminal = status === 'resolved' || status === 'rejected'
            const badge = STATUS_BADGE[status] || STATUS_BADGE.pending

            setIncidents((prev) =>
              isTerminal
                ? prev.filter((item) => item.reference_no !== reference_no)
                : prev.map((item) =>
                    item.reference_no === reference_no
                      ? { ...item, rawStatus: status, statusLabel: badge.label, statusBg: badge.style }
                      : item
                  )
            )

            setSelectedIncident((prev) => {
              if (!prev || prev.reference_no !== reference_no) return prev
              if (isTerminal) {
                setTimeout(() => setSelectedIncident(null), 1000)
                return { ...prev, rawStatus: status, statusLabel: badge.label, statusBg: badge.style }
              }
              return { ...prev, rawStatus: status, statusLabel: badge.label, statusBg: badge.style }
            })
          }

          if (payload.event === 'VOICEMAIL_ATTACHED') {
            const { reference_no, voicemail_file_id } = payload.data || {}
            setIncidents((prev) =>
              prev.map((item) => (item.reference_no === reference_no ? { ...item, voicemail_file_id } : item))
            )
            setSelectedIncident((prev) =>
              prev && prev.reference_no === reference_no ? { ...prev, voicemail_file_id } : prev
            )
          }
        } catch (e) {
          console.error('Ticket WS parsing error', e)
        }
      }

      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(() => {
            loadTickets()
            connectWS()
          }, 2000)
        }
      }
    }

    connectWS()

    return () => {
      isUnmounted = true
      clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }, [loadTickets])

  const handleOpenModal = (incident) => {
    setActionError('')
    setSelectedIncident(incident)
  }

  const handleCloseModal = useCallback(
    (e) => {
      if (e) e.stopPropagation()
      if (isUpdating) return
      setSelectedIncident(null)
      setActionError('')
    },
    [isUpdating]
  )

  const handleStatusChange = async (newStatus) => {
    if (!selectedIncident || isUpdating) return

    setIsUpdating(true)
    setActionError('')
    const refNo = selectedIncident.reference_no

    try {
      await updateIncidentStatus(refNo, newStatus)

      const isTerminal = newStatus === 'resolved' || newStatus === 'rejected'
      const badge = STATUS_BADGE[newStatus] || STATUS_BADGE.pending

      if (isTerminal) {
        setIncidents((prev) => prev.filter((item) => item.reference_no !== refNo))
        setTimeout(() => setSelectedIncident(null), 1000)
      } else {
        setIncidents((prev) =>
          prev.map((item) =>
            item.reference_no === refNo
              ? { ...item, rawStatus: newStatus, statusLabel: badge.label, statusBg: badge.style }
              : item
          )
        )
        setSelectedIncident((prev) =>
          prev ? { ...prev, rawStatus: newStatus, statusLabel: badge.label, statusBg: badge.style } : null
        )
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update incident status.')
      throw err
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="h-full bg-zinc-900 w-[45vh] border border-zinc-700 rounded-xl p-2 overflow-hidden flex flex-col">
      <div className="border-b border-zinc-800 py-2 px-1 flex justify-between items-center">
        <p className="text-xs font-semibold text-white">Recent Incidents</p>
        <div className="flex justify-center items-center cursor-pointer">
          <p className="text-[10px] font-semibold text-zinc-400">View All</p>
          <span className="material-symbols-outlined text-zinc-400" style={{ fontSize: '16px' }}>
            arrow_right_alt
          </span>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-zinc-800/60">
        {incidents.length === 0 ? (
          <p className="text-zinc-500 text-xs text-center py-6">No recent incidents recorded.</p>
        ) : (
          incidents.map((item, idx) => (
            <IncidentTicketItem
              key={item.id || item.reference_no || idx}
              item={item}
              onSelect={handleOpenModal}
            />
          ))
        )}
      </div>

      <IncidentDetailsModal
        incident={selectedIncident}
        onClose={handleCloseModal}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
        error={actionError}
      />
    </div>
  )
}

export default TicketManagement