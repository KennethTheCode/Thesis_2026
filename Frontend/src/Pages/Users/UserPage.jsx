import React from 'react'
import UserMap from './UserMap'
import Navbar from '../../Components/Navbar'
import SOS from './SOS'

function UserPage() {
  return (
    <div >
      <Navbar/>
      <div className='flex-col h-screen flex items-center'>
          <div className='flex flex-col items-center'>
            <UserMap/>
            <SOS/>  
          </div>          
      </div>
        
    </div>
  )
}

export default UserPage