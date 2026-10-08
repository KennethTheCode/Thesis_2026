import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import LandingPage from './Pages/LandingPage'
import SignUp from './Pages/SignUp'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Could not connect to FastAPI backend'))
  }, [])

  return (
    <Router>
      <div className="min-h-screen px-5 sm:px-0 bg-zinc-900 bg-[linear-gradient(to_right,rgba(156,163,175,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.08)_1px,transparent_1px)] bg-[size:35px_35px]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App