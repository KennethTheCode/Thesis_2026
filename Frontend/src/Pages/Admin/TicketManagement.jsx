import React, { useEffect, useState } from 'react'
import { getIncidentWSUrl, getMapIncidents } from './Incidents/IncidentApi.js'
import AdminMap from './AdminMap.jsx'
import ApproveTicket from './ApproveTicket.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function TicketManagement() {
  const [showModal, setShowModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [incidents, setIncidents] = useState([])

  // 1. Fetch initial incidents on component mount
  useEffect(() => {
    getMapIncidents()
      .then((data) => {
        const formatted = data.map((inc) => ({
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
          status: inc.status === 'reported' ? 'Pending' : inc.status,
          statusBg: inc.status === 'reported' ? 'bg-orange-400/20 text-orange-400' : 'bg-green-400/20 text-green-400'
        }))
        setIncidents(formatted)
      })
      .catch((err) => console.error('Failed to load tickets:', err))
  }, [])

  // 2. Listen to WebSocket for real-time SOS broadcasts
  useEffect(() => {
    const ws = new WebSocket(getIncidentWSUrl())

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.event === 'NEW_INCIDENT') {
          const inc = payload.data
          const newItem = {
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
            time: new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Pending',
            statusBg: 'bg-red-500/20 text-red-400 animate-pulse'
          }
          setIncidents((prev) => [newItem, ...prev])
        }
      } catch (e) {
        console.error('Ticket WS parsing error', e)
      }
    }

    return () => ws.close()
  }, [])

  const handleOpenModal = (incident) => {
    setSelectedIncident(incident)
    setShowModal(true)
  }

  const handleCloseModal = (e) => {
    e.stopPropagation()
    setShowModal(false)
    setSelectedIncident(null)
  }

  return (
    <div className='h-full bg-zinc-900 w-[45vh] border border-zinc-700 rounded-xl p-2 overflow-hidden flex flex-col'>
      <div className='border-b border-zinc-800 py-2 px-1 flex justify-between items-center'>
        <p className='text-xs font-semibold text-white'>Recent Incidents</p>
        <div className='flex justify-center items-center cursor-pointer'>
          <p className='text-[10px] font-semibold text-zinc-400'>View All</p>
          <span className="material-symbols-outlined text-zinc-400" style={{ fontSize: '16px' }}>arrow_right_alt</span>
        </div>                
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-zinc-800/60">
        {incidents.length === 0 ? (
          <p className="text-zinc-500 text-xs text-center py-6">No recent incidents recorded.</p>
        ) : (
          incidents.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleOpenModal(item)} 
              className='cursor-pointer w-full p-2 py-3 flex justify-between items-center hover:bg-zinc-800/30 transition-colors'
            >
              <div className='flex items-center gap-2'>
                <div className='bg-red-500/20 p-2 flex items-center justify-center rounded-full'>
                  <span className="material-symbols-outlined text-red-500">car_crash</span>
                </div>
                <div className='flex flex-col'>
                  <p className='text-xs font-bold text-white'>{item.title}</p>                 
                  <p className='text-[10px] font-thin text-gray-300'>{item.locationName}</p>
                  <div className='flex items-center gap-1 text-zinc-400 mt-0.5'>
                    <span className="material-symbols-outlined text-[10px]" style={{ fontSize: '12px' }}>schedule</span>
                    <p className='text-[10px] font-thin'>{item.time}</p>
                  </div>
                </div>
              </div>
              <button className={`p-1.5 px-2.5 text-[9px] font-medium rounded-lg ${item.statusBg}`}>{item.status}</button>
            </div>
          ))
        )}
      </div>

      {/* Modal with Isolated Incident Map & Voicemail Player */}
      {showModal && selectedIncident && (
        <div 
          onClick={handleCloseModal} 
          className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-zinc-900 p-5 rounded-2xl w-full max-w-md border border-zinc-700 flex flex-col gap-4 text-white"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-base text-red-500">Emergency Incident Details</h3>
              <span 
                onClick={handleCloseModal} 
                className="material-symbols-outlined text-zinc-400 cursor-pointer hover:text-white"
              >
                close
              </span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700">
                <p><strong>Reference No:</strong> <span className="text-white">{selectedIncident.reference_no || selectedIncident.id}</span></p>
                <p><strong>Contact Email:</strong> <span className="text-white">{selectedIncident.email}</span></p>
                <p><strong>Contact Number:</strong> <span className="text-white">{selectedIncident.contact_number}</span></p>
                <p><strong>Barangay:</strong> <span className="text-white">{selectedIncident.barangay}</span></p>
                <p><strong>Reported Time:</strong> <span className="text-white">{selectedIncident.time}</span></p>
                <p><strong>Status:</strong> <span className="text-amber-400 font-semibold">{selectedIncident.status}</span></p>
                </div>

                {/* Voicemail Audio Player Section */}
                {selectedIncident.voicemail_file_id ? (
                <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700 flex flex-col gap-1.5">
                    <div className="flex mb-2 items-center gap-2 text-xs text-red-400 font-semibold">
                    <span className="material-symbols-outlined text-base">record_voice_over</span>
                    <span>Citizen Voicemail Recording</span>
                    </div>
                    <audio 
                    controls 
                    src={`${API_URL}/incidents/voicemail/${selectedIncident.voicemail_file_id}`} 
                    className="w-full h-8 rounded"
                    />
                </div>
                ) : (
                <div className="bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
                    No voicemail recording attached.
                </div>
                )}
            </div>
            {/* Map renders ONLY the selected incident */}
            <div className="w-full h-64 rounded-xl overflow-hidden border border-zinc-700">
              <AdminMap showFacilities={false} focusIncident={selectedIncident} />
            </div>

            <div className="flex justify-between gap-2 pt-1">
            <div className="flex gap-2">
              <ApproveTicket />
              
              <button 
                onClick={handleCloseModal} 
                className="bg-red-500/20 hover:bg-red-600 text-red-500 hover:text-red-400 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-300"
              >
                Reject
              </button>
            </div>
              <button 
                onClick={handleCloseModal} 
                className="bg-amber-500/20 hover:bg-amber-600 text-amber-500 hover:text-amber-400 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-300"
              >
                Record Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketManagement