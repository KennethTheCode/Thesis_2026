import React from 'react'
import UserMap from './UserMap'
import Navbar from '../../Components/Navbar'
import SOS from './SOS'

function UserPage() {
  return (
    <div className="flex flex-col min-h-screen ">
      <Navbar />
      <div className="flex flex-col flex-1 h-[calc(100vh-80px)] p-3 gap-3 justify-between items-center w-full max-w-7xl mx-auto">
        {/* Upper viewport: Interactive Facilities Map */}
        <div className="w-full flex-1 min-h-[65vh]">
          <UserMap />
        </div>

        {/* Bottom anchor: SOS Emergency Request Button */}
        <div className="w-full flex justify-center items-center">
          <SOS />
        </div>
      </div>
    </div>
  )
}

export default UserPage