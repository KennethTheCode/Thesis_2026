import React from 'react'
import Navbar from '../../../Components/Navbar'
import LiveIncidents from './LiveIncidents'

function ManageIncidents() {
  return (
    <div>
        <Navbar/>
        <div className='flex flex-col gap-2 p-3 h-[calc(100vh-80px)]'>
            <LiveIncidents/>
        </div>
    </div>
  )
}

export default ManageIncidents