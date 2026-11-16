import { useState, useEffect, useRef } from 'react'
import Logo from '../Images/Logo.png'

function LandingPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const timerRef = useRef(null)

  // 3-Second Button Rate Limiter Timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [cooldown])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Client-Side Input Sanitization Function
  const sanitizeInput = (str) => {
    return str.trim().replace(/[<>/'"]/g, '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUsername = sanitizeInput(formData.username)
    const cleanPassword = formData.password.trim()

    if (!cleanUsername || !cleanPassword) {
      setError('Please fill in both username and password.')
      return
    }

    // Trigger 3-second button rate limiter
    setIsSubmitting(true)
    setCooldown(3)

    try {
      const response = await fetch('http://127.0.0.1:8000/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.')
      }

      // Save authenticated user profile locally
      localStorage.setItem('user', JSON.stringify(data.user))

      // Role-Based Navigation
      if (data.user.role === 'admin') {
        window.location.href = '/admin-dashboard'
      } else {
        window.location.href = '/user'
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-neutral-900 p-8 rounded shadow-md w-full max-w-md border border-neutral-800">
        <div className="flex flex-col">
          <img src={Logo} alt="Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-center mb-1 text-white">ResQ:Biñan</h1>
          <p className="text-sm font-thin text-gray-400 text-center mb-6">
            Road Accident Emergency Response System
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username Input */}
          <div className="mb-4 gap-2 flex flex-col">
            <label className="text-gray-400 text-sm font-thin">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="px-3 py-2 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              placeholder="Enter your username"
            />
          </div>

          {/* Password Input with Eye Icon Toggle */}
          <div className="mb-6 gap-2 flex flex-col">
            <label className="text-gray-400 text-sm font-thin">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 text-gray-400 hover:text-gray-200 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye Off Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                  </svg>
                ) : (
                  /* Eye Open Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button with 3s Rate Limiting */}
          <button
            type="submit"
            disabled={cooldown > 0 || isSubmitting}
            className={`w-full font-bold py-2.5 px-4 rounded text-white transition-colors duration-300 focus:outline-none ${
              cooldown > 0 || isSubmitting
                ? 'bg-red-800/50 cursor-not-allowed text-gray-400'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {cooldown > 0 ? `Please wait...` : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-800 py-2">
          <p className="text-gray-400 text-sm font-thin">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-500 hover:underline font-normal">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage