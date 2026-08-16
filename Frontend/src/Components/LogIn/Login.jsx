import { useState } from "react";
import API_URL from "../../config";
import Logo from "../../Images/Logo.png";


function Login() {
  return (
    <div className="flex mt-5 justify-center w-full h-screen items-center">
        <div className="border bg-black border-gray-900 rounded w-[35vh] gap-3 flex flex-col p-4">
            <div className="flex flex-col items-center gap-2 ">
             <img src={Logo} alt="Logo" className="h-[8vh] object-contain bg-gray-200 rounded-full"/>
             <p className="text-[12px] text-gray-200 font-semibold">Lost something? let's PerpsFind it!</p>
            </div> 
            <div className="flex flex-col gap-2 border-b border-gray-800 pb-5">
                <p className="text-gray-200 font-semibold text-[10px]">Username or email address</p>
                <input className="p-1 text-gray-200 placeholder:text-gray-500 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"></input>
                
                 <div className="flex flex-row justify-between">
                 <p className="text-gray-200 font-semibold text-[10px]">Password</p>
                 <p className="text-blue-500 font-semibold text-[10px] hover:underline cursor-pointer">Forgot password?</p>
                 </div>
                <input className="mb-1 p-1 text-gray-200 placeholder:text-gray-500 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"></input>  

                <button className="text-[10px] bg-green-700 hover:bg-green-800 text-white cursor-pointer duration-300 transition-colors font-semibold py-2 px-4 rounded">Log In</button>        
            </div>

            <button className="text-[10px] border border-gray-800 bg-slate-900 hover:bg-slate-950 text-white cursor-pointer duration-300 transition-colors font-semibold py-2 px-4 rounded">Continue with Google</button>        
            <p className="text-center text-gray-200 text-[10px]">Don't have an account? <span className="text-blue-500 font-semibold hover:underline cursor-pointer">Sign up</span></p>
            <p className="text-center text-gray-500 text-[10px]">© 2026 PerpsFind. All Rights Reserved.</p>
        </div>
    </div>
  );
}

export default Login;