import React from 'react'

function LiveIncidents() {
  return (
    <div className='w-full bg-zinc-900 border border-zinc-700 rounded p-2 flex overflow-x-auto'>
        <div className='flex flex-col gap-2 h-[40vh] w-[40vh] bg-zinc-800 rounded px-2'>
            <div className='w-full border-b border-red-500 py-2 justify-between flex items-center '>
                <p className='text-zinc-200 font-semibold text-sm'>Car Crash</p>
                <p className='text-zinc-400 font-thin text-[12px]'>Just now</p>
            </div>
            <div className='w-full px-1 flex flex-col justify-between  gap-2'>
                <div className='flex  justify-between items-center'>
                    <p className='text-zinc-200 font-semibold text-[12px]'>Location:</p>
                    <p className='text-zinc-400 font-thin text-[12px]'>Brgy. Mamplasan, Binan City, Laguna</p>
                </div>

                <div className='flex justify-between items-center '>
                    <p className='text-zinc-200 font-semibold text-[12px]'>Severity:</p>
                    <p className='text-red-400 font-thin text-[12px]'>High</p>
                </div>

                <div className='flex p-1 bg-red-500/20 rounded h-20'>
                    <p className='text-zinc-200  text-[12px]'>Car crash in brgy mamplasan 1 road accident send help urgent.</p>
                </div>
            </div>
            <div className='w-full border border-zinc-700 rounded h-full mb-3 flex justify-between items-center'>

            </div>
        </div>
    </div>
  )
}

export default LiveIncidents