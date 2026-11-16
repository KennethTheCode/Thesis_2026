import React from 'react'
import AdminMap from './AdminMap.jsx'
import VerifyTicket from './VerifyTicket.jsx'
import RejectTicket from './RejectTicket.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function IncidentDetailsModal({ incident, onClose, onStatusChange, isUpdating, error }) {
  if (!incident) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 p-5 rounded-2xl w-full max-w-md border border-zinc-700 flex flex-col gap-4 text-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <h3 className="font-bold text-base text-red-500">Emergency Incident Details</h3>
          <span
            onClick={onClose}
            className="material-symbols-outlined text-zinc-400 cursor-pointer hover:text-white"
          >
            close
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 p-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Citizen Metadata & Voicemail */}
        <div className="flex flex-col gap-2">
          <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700">
            <p><strong>Reference No:</strong> <span className="text-white">{incident.reference_no || incident.id}</span></p>
            <p><strong>Contact Email:</strong> <span className="text-white">{incident.email}</span></p>
            <p><strong>Contact Number:</strong> <span className="text-white">{incident.contact_number}</span></p>
            <p><strong>Barangay:</strong> <span className="text-white">{incident.barangay}</span></p>
            <p><strong>Reported Time:</strong> <span className="text-white">{incident.time}</span></p>
            <p>
              <strong>Status:</strong>{' '}
              <span className="text-amber-400 font-semibold uppercase">{incident.statusLabel}</span>
            </p>
          </div>

          {incident.voicemail_file_id ? (
            <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 flex flex-col gap-1.5">
              <div className="flex mb-1 items-center gap-2 text-xs text-red-400 font-semibold">
                <span className="material-symbols-outlined text-base">record_voice_over</span>
                <span>Citizen Voicemail Recording</span>
              </div>
              <audio
                controls
                src={`${API_URL}/incidents/voicemail/${incident.voicemail_file_id}`}
                className="w-full h-8 rounded"
              />
            </div>
          ) : (
            <div className="bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
              No voicemail recording attached.
            </div>
          )}
        </div>

        {/* Isolated Incident Map */}
        <div className="w-full h-64 rounded-xl overflow-hidden border border-zinc-700">
          <AdminMap showFacilities={false} focusIncident={incident} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <VerifyTicket
              currentStatus={incident.rawStatus}
              onUpdateStatus={onStatusChange}
              disabled={isUpdating}
            />
            <RejectTicket
              currentStatus={incident.rawStatus}
              onReject={onStatusChange}
              disabled={isUpdating}
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncidentDetailsModal