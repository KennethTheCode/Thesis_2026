import React from 'react'
import { IncidentProvider } from './context/IncidentContext.jsx' // adjust relative path if needed
import AdminMap from './AdminMap.jsx'
import TicketManagement from './TicketManagement.jsx'
import Navbar from '../../Components/Navbar'

function AdminDashboard() {
  return (
    <IncidentProvider>
     <Navbar/>
      <div className='flex p-3 gap-2 h-[calc(100vh-80px)]'>
        <TicketManagement />
        <div className='w-full h-full min-h-[420px]'>
          <AdminMap showFacilities={false}/>
        </div>
      </div>
    </IncidentProvider>
  )
}

export default AdminDashboard