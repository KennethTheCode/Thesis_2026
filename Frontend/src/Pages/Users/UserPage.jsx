import React from 'react'
import UserMap from './UserMap'

function UserPage() {
  return (
    <div>
        <div className="flex flex-col items-center justify-center min-h-screen px-5">
            <div className="border border-white h-[70vh] rounded shadow-md w-full">
                <UserMap/>
            </div>
            <div className=" w-full mt-3 flex space-x-4 items-center ">
                <div className="w-[25vh]flex bg-zinc-900 rounded border border-zinc-700 shadow-md justify-between p-5 flex-col items-center px-3">
                  <div className="w-full flex items-center justify-between w-full text-[12px] font-thin">
                    <p>452m</p>
                    <p>452m</p>
                  </div>
                  <div className="flex flex-col items-left ">
                    <p className="font-bold text-gray-100 text-[14px]">Binan City General Hospital</p>
                    <p className="font-semibold text-[12px] text-red-500">(02) 8988-8888</p>
                  </div>
                </div>

               
            </div>
        </div>
    </div>
  )
}

export default UserPage