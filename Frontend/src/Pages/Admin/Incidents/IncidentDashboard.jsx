import React from 'react'

function IncidentDashboard() {
  return (
    <div className='w-full p-1 h-[20vh] flex  gap-5'>
        <div className='flex flex-col items-center bg-zinc-900 border border-zinc-800 p-5 w-full rounded'>
            <h2 className='text-lg font-bold text-white'>Active Incidents</h2>
        </div>

        <div className='flex flex-col justify-between items-center bg-zinc-900 border border-zinc-800 p-5 w-full rounded  '>
            <h2 className='text-lg font-bold text-white'>Need Validation</h2>
        </div>

        <div className='flex flex-col justify-between items-center bg-zinc-900 border border-zinc-800 p-5 w-full rounded'>
            <h2 className='text-lg font-bold text-white'>Verification Requests</h2>
        </div>

         <div className='flex flex-col justify-between items-center bg-zinc-900 border border-zinc-800 p-5 w-full rounded'>
            <h2 className='text-lg font-bold text-white'>Total Incidents</h2>
        </div>
    </div>
  )
}

export default IncidentDashboard