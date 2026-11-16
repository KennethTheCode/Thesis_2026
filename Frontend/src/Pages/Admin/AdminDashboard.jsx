import React from 'react'
import Navbar from '../../Components/Navbar'
import TicketManagement from './TicketManagement'
import AdminMap from './AdminMap'

function AdminDashboard() {
  return (
    <div>
      <Navbar/>
      <div className='flex p-3 gap-2 h-[calc(100vh-80px)]'>
        <TicketManagement />
        <div className='w-full h-full min-h-[420px]'>
          <AdminMap showFacilities />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard