import React, { useState } from 'react'
import AdminMap from '../AdminMap'
import Navbar from '../../../Components/Navbar'
import ViewFacilities from './ViewFacilities'
import FacilityCards from './FacilityCards'

function ManageFacilities() {
  // Bump this number whenever a facility is added/archived/restored.
  // The table, archive list and map all reload when it changes, so no page refresh is needed.
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)

  return (
    <div>
    <Navbar/>
    <div className='p-3 flex-col flex gap-2'>
        <div className='h-[50vh]'>
         <AdminMap showFacilities refreshKey={refreshKey} />
        </div>
        <ViewFacilities refreshKey={refreshKey} onChanged={refresh} />
    </div>
    </div>
  )
}

export default ManageFacilities