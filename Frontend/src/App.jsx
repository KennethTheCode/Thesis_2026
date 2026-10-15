import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import LandingPage from './Pages/LandingPage'
import SignUp from './Pages/SignUp'

function App() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/users/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        return response.json()
      })
      .then((data) => setUsers(data))
      .catch(() => setError('Could not connect to FastAPI backend'))
  }, [])

  return (
    <Router>
      <div className="min-h-screen px-5 sm:px-0 bg-zinc-900 bg-[linear-gradient(to_right,rgba(156,163,175,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.08)_1px,transparent_1px)] bg-[size:35px_35px] text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>

        <div className="mx-auto max-w-4xl px-5 pb-10">
          <h2 className="mb-4 text-2xl font-bold">Users</h2>
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : users.length === 0 ? (
            <p>Loading users...</p>
          ) : (
            <ul className="space-y-3">
              {users.map((user) => (
                <li key={user.id} className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-zinc-300">{user.contact_number}</p>
                  <p className="text-sm text-emerald-400">Status: {user.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Router>
  )
}

export default App