import React from 'react'

function TicketManagement() {
  return (
    <div className='h-[50%] p-3 bg-zinc-900 w-[45vh] '>
        <div className='border-zinc-700 border p-2 h-screen rounded bg'>
            <div className='border-b border-zinc-800 py-1 flex justify-between flex items-center'>
                <p className='text-xs font-semibold'>Recent Incidents</p>
                <div className='flex justify-center items-center'>
                    <p className='text-[10px] font-semibold text-zinc-400'>View All</p>
                    <span class="material-symbols-outlined text-zinc-400" style={{ fontSize: '16px' }}>arrow_right_alt</span>
                </div>                
            </div>
            <div className='border-b border-zinc-800 w-full p-1 py-4 flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                    <div className='bg-red-500/20 p-2  flex items-center  justify-center rounded-full'>
                        <span class="material-symbols-outlined text-red-500">car_crash</span>
                    </div>
                    <div className='flex flex-col '>
                        <p className='text-xs font-bold'>Road Accident</p>                 
                        <p className='text-[10px] font-thin text-gray-300'>Brgy. Mamplasan, Binan City, Laguna</p>
                        <div className='flex items-center gap-1'>
                            <span class="material-symbols-outlined text-[10px]" style={{ fontSize: '12px' }}>schedule</span>
                            <p className='text-[10px] font-thin'>10:42 AM - Oct 27, 2026</p>
                        </div>
                    </div>
                </div>
                <button className='bg-orange-400/20 p-2 text-[8px] rounded-lg text-orange-400'>Pending</button>
            </div>

            <div className='border-b border-zinc-800 w-full p-1 py-4 flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                    <div className='bg-red-500/20 p-2  flex items-center  justify-center rounded-full'>
                        <span class="material-symbols-outlined text-red-500">car_crash</span>
                    </div>
                    <div className='flex flex-col '>
                        <p className='text-xs font-bold'>Road Accident</p>                 
                        <p className='text-[10px] font-thin text-gray-300'>Brgy. Kanluran, Binan City, Laguna</p>
                        <div className='flex items-center gap-1'>
                            <span class="material-symbols-outlined text-[10px]" style={{ fontSize: '12px' }}>schedule</span>
                            <p className='text-[10px] font-thin'>8:30 AM - Oct 27, 2026</p>
                        </div>
                    </div>
                </div>
                <button className='bg-green-400/20 p-2 text-[8px] rounded-lg text-green-400'>Resolved</button>
            </div>
        </div>
        
    </div>
  )
}

export default TicketManagement