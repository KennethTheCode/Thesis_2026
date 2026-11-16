import React from 'react'
import Navbar from '../../../Components/Navbar'
import LiveIncidents from './LiveIncidents'
import IncidentDashboard from './IncidentDashboard'
import Verification from './Verification'
import IncidentsFiles from './IncidentsFiles'

function ManageIncidents() {
  return (
    <div>
        <Navbar/>
        <div className='flex gap-2 p-3 h-screen w-full'>
            <div className='flex flex-col gap-2 w-full h-full'>
                <IncidentDashboard/>
                <Verification/>
                <IncidentsFiles />

            </div>
            <LiveIncidents/>
        </div>
    </div>
  )
}

export default ManageIncidents