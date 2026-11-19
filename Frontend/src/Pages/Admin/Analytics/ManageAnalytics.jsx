import React from 'react'
import Navbar from '../../../Components/Navbar'
import IncidentHotspotMap from './IncidentHotspotMap'

function ManageAnalytics() {
  return (
    <div>
        <Navbar />
        <div className='flex flex-col gap-2 p-3 h-screen w-full'>
            <IncidentHotspotMap />
        </div>
    </div>
  )
}

export default ManageAnalytics