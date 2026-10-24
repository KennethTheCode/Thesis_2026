import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import LandingPage from './Pages/LandingPage'
import SignUp from './Pages/SignUp'
import UserPage from './Pages/Users/UserPage'

function App() {
  

  return (
    <Router>
    <div className="min-h-screen px-5 sm:px-0 text-white bg-zinc-900 bg-[radial-gradient(ellipse_at_left,rgba(59,130,246,0.15),transparent_0%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.10),transparent_45%),linear-gradient(to_right,rgba(156,163,175,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.07)_1px,transparent_1px)] bg-[size:auto,auto,30px_30px,30px_30px]"> 
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/user" element={<UserPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App