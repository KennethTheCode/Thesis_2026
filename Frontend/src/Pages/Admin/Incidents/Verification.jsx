import React, { useState } from 'react'

function Verification() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className='bg-zinc-900 border border-zinc-800 rounded px-2 py-2 flex flex-col overflow-y-auto w-full'>
        <div className='flex justify-between items-center border-b border-zinc-800 pb-2 mb-3'>
            <h2 className='text-sm font-bold text-white'>Verification Requests</h2>
            <div className='flex gap-1 items-center text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors duration-300'> 
                <p>
                    See All
                </p>
                <span class="material-symbols-outlined hover:text-zinc-400 duration-300 transition-colors cursor-pointer" style= {{ fontSize: '20px' }}>
                    arrow_right_alt
                </span>
            </div>
           
        </div>
        <div className='flex gap-2 overflow-x-auto'>
            <div onClick={() => setShowModal(true)} className='hover:bg-zinc-800 cursor-pointer transition-colors duration-300 border-zinc-800 border-r-2 p-2 w-[30%] flex gap-2'>
                <div className='border border-red-500 p-11 rounded-full'>

                </div>
                <div className='bg-zinc-800/30 w-full p-1.5 flex flex-col gap-1'>
                    <p className='text-zinc-200 text-[12px] '>Miguel Samantha Dela Rosa</p>
                    <p className='text-zinc-300 text-[11px] font-thin'>#36 18th Street Pacita San Pedro Laguna Luzon CALABARZON</p>
                    <p className='text-zinc-200 text-[11px] font-thin'>09764558683</p>
                </div>
            </div>

            <div onClick={() => setShowModal(true)} className='hover:bg-zinc-800 cursor-pointer transition-colors duration-300 border-zinc-800 border-r-2 p-2 w-[30%] flex gap-2'>
                <div className='border border-red-500 p-11 rounded-full'>

                </div>
                <div className='bg-zinc-800/30 w-full p-1.5 flex flex-col gap-1'>
                    <p className='text-zinc-200 text-[12px] '>Miguel Samantha Dela Rosa</p>
                    <p className='text-zinc-300 text-[11px] font-thin'>#36 18th Street Pacita San Pedro Laguna Luzon CALABARZON</p>
                    <p className='text-zinc-200 text-[11px] font-thin'>09764558683</p>
                </div>
            </div>

            {showModal && (
                <div className="bg-black/20 fixed inset-0 z-[100] flex justify-center items-center">
                    <div className='bg-zinc-900  border border-zinc-800 rounded w-[25vw] max-w-3xl flex flex-col'>
                        <div className='flex justify-between items-center border-b border-red-700/40 pb-2 mb-3 p-3'>
                            <h2 className='text-sm font-bold text-white'>Verification Request</h2>
                            <div onClick={() => setShowModal(false)} className='flex gap-1 items-center text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors duration-300'>
                                <span class="material-symbols-outlined hover:text-zinc-400 duration-300 transition-colors cursor-pointer" style= {{ fontSize: '20px' }}>
                                    close
                                </span>
                            </div>
                        </div>
                        <div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

export default Verification