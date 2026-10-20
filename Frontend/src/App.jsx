import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import LandingPage from './Pages/LandingPage'
import SignUp from './Pages/SignUp'
import UserPage from './Pages/Users/UserPage'

function App() {
  

  return (
    <Router>
      <div className="min-h-screen px-5 sm:px-0 bg-zinc-900 bg-[linear-gradient(to_right,rgba(156,163,175,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.08)_1px,transparent_1px)] bg-[size:35px_35px] text-white">
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