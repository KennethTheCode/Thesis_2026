import React from 'react'
import Navbar from '../../Components/Navbar'
import TicketManagement from './TicketManagement'

function AdminDashboard() {
  return (
    <div>
      <Navbar/>
        <div>
            <TicketManagement/>
        </div>
    </div>
  )
}

export default AdminDashboard