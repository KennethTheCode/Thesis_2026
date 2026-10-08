import { useEffect, useState } from 'react'
import Logo from '../Images/Logo.png'
function SignUp() {

  return (
   <div className="flex flex-col items-center justify-center min-h-screen ">
        <div className="bg-neutral-900 p-8 rounded shadow-md w-full max-w-md">
            <div className="flex flex-col">
                <img src={Logo} alt="Logo" className="w-24 h-24 mx-auto mb-4" />
                <h1 className="text-lg font-bold text-center mb-4 text-white">ResQ:Biñan</h1>
                <p className="text-sm font-thin text-gray-400 text-center mb-4">Road Accident Emergency Response System</p>
            </div>
            <form>
                <div className="mb-4 gap-2 flex flex-col">
                    <p className="text-gray-400 text-sm font-thin">Create Username</p>
                    <input type="text" className="px-2 py-1 bg-neutral-800 text-gray-400 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter your username" />
                </div>

                <div className="mb-4 gap-2 flex flex-col">
                    <p className="text-gray-400 text-sm font-thin">Create Password</p>
                    <input type="text" className="px-2 py-1 bg-neutral-800 text-gray-400 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter your password" />
                </div>

                <div className="mb-4 gap-2 flex flex-col">
                    <p className="text-gray-400 text-sm font-thin">Confirm Password</p>
                    <input type="text" className="px-2 py-1 bg-neutral-800 text-gray-400 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Confirm your password" />
                </div>

                <div className="mb-4 gap-2 flex flex-col">
                    <p className="text-gray-400 text-sm font-thin">Date of Birth</p>
                    <input type="date" className="px-2 py-1 bg-neutral-800 text-gray-400 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter your date of birth" />
                </div>

                <div className="mb-4 gap-2 flex flex-col">
                    <p className="text-gray-400 text-sm font-thin">Address</p>
                    <input type="text" className="px-2 py-1 bg-neutral-800 text-gray-400 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter your address" />
                </div>

                <div className="mb-4 gap-2 flex flex-col">
                    <p className="text-gray-400 text-sm font-thin">Valid ID</p>
                    <input type="file" className="px-2 py-1 bg-neutral-800 text-gray-400 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter your valid ID" />
                </div>
                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 duration-300 transition-colors text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">Create Account</button>                
            </form>
            <div className="mt-6 text-center border-t border-gray-700 py-2">
                <p className="text-gray-400 text-sm font-thin">Already have an account? <a href="/" className="text-blue-500 hover:underline">Log In</a></p>
            </div>
        </div>
   </div>
  )
}

export default SignUp