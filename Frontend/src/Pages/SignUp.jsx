import { useState, useEffect, useRef } from 'react'
import Logo from '../Images/Logo.png'

const VALID_IDS = [
  "Driver's License",
  "Passport",
  "SSS",
  "PhilHealth",
  "Voter ID",
  "Postal ID",
  "National ID",
  "UMID"
]

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    gender: 'Male',
    validIdType: "Driver's License",
    address: '',
    contactNumber: '',
    termsAccepted: false
  })

  const [idFile, setIdFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const timerRef = useRef(null)

  // Rate Limiter Cooldown Count Down
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
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        setErrors((prev) => ({ ...prev, idFile: 'Only JPG, PNG, and WebP images are allowed.' }))
        setIdFile(null)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, idFile: 'File size must be under 5MB.' }))
        setIdFile(null)
        return
      }
      setErrors((prev) => ({ ...prev, idFile: '' }))
      setIdFile(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) newErrors.username = 'Username is required.'
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters.'

    if (!formData.password) {
      newErrors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
    } else if (!/(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter and one number.'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Date of birth is required.'
    } else {
      const birthDate = new Date(formData.birthday)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
      if (age < 18) newErrors.birthday = 'You must be at least 18 years old.'
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required.'

    const phoneRegex = /^(09|\+639)\d{9}$/
    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required.'
    } else if (!phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Enter a valid PH mobile number (e.g., 09123456789).'
    }

    if (!idFile) newErrors.idFile = 'Valid ID picture is required.'
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the Terms and Conditions.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setSuccessMsg('')

    if (!validateForm()) return

    // Enforce 3-Second Rate Limiter
    setIsSubmitting(true)
    setCooldown(3)

    const payload = new FormData()
    payload.append('username', formData.username)
    payload.append('password', formData.password)
    payload.append('confirm_password', formData.confirmPassword)
    payload.append('birthday', formData.birthday)
    payload.append('gender', formData.gender)
    payload.append('valid_id_type', formData.validIdType)
    payload.append('address', formData.address)
    payload.append('contact_number', formData.contactNumber)
    payload.append('terms_accepted', formData.termsAccepted)
    payload.append('valid_id_picture', idFile)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: payload
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed.')
      }

      setSuccessMsg('Account registered successfully! Redirecting to login...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10">
      <div className="bg-neutral-900 p-8 rounded shadow-md w-full max-w-lg border border-neutral-800">
        <div className="flex flex-col">
          <img src={Logo} alt="Logo" className="w-24 h-24 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-center text-white">ResQ:Biñan</h1>
          <p className="text-xs font-thin text-gray-400 text-center mb-6">
            Road Accident Emergency Response System
          </p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 text-xs rounded">
            {apiError}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 text-xs rounded">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="mb-4 flex flex-col">
            <label className="text-gray-400 text-xs font-thin mb-1">Create Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="px-3 py-2 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              placeholder="Enter your username"
            />
            {errors.username && <span className="text-red-400 text-xs mt-1">{errors.username}</span>}
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-gray-400 text-xs font-thin mb-1">Create Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="px-3 py-2 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
                placeholder="Enter password"
              />
              {errors.password && <span className="text-red-400 text-xs mt-1">{errors.password}</span>}
            </div>

            <div className="flex flex-col">
              <label className="text-gray-400 text-xs font-thin mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="px-3 py-2 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <span className="text-red-400 text-xs mt-1">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Birthday & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-gray-400 text-xs font-thin mb-1">Date of Birth</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="px-3 py-2 bg-neutral-800 text-gray-200 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              />
              {errors.birthday && <span className="text-red-400 text-xs mt-1">{errors.birthday}</span>}
            </div>

            <div className="flex flex-col">
              <label className="text-gray-400 text-xs font-thin mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="px-3 py-2 bg-neutral-800 text-gray-200 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Contact Number */}
          <div className="mb-4 flex flex-col">
            <label className="text-gray-400 text-xs font-thin mb-1">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="px-3 py-2 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              placeholder="e.g., 09123456789"
            />
            {errors.contactNumber && (
              <span className="text-red-400 text-xs mt-1">{errors.contactNumber}</span>
            )}
          </div>

          {/* Address */}
          <div className="mb-4 flex flex-col">
            <label className="text-gray-400 text-xs font-thin mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="px-3 py-2 bg-neutral-800 text-gray-200 placeholder:text-gray-500 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              placeholder="Enter your street address in Biñan"
            />
            {errors.address && <span className="text-red-400 text-xs mt-1">{errors.address}</span>}
          </div>

          {/* Valid ID Select & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-gray-400 text-xs font-thin mb-1">Valid ID Type</label>
              <select
                name="validIdType"
                value={formData.validIdType}
                onChange={handleChange}
                className="px-3 py-2 bg-neutral-800 text-gray-200 border-b border-gray-600 focus:outline-none focus:border-red-500 text-sm rounded-t"
              >
                {VALID_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-gray-400 text-xs font-thin mb-1">Upload ID Picture</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="px-2 py-1 bg-neutral-800 text-gray-400 border-b border-gray-600 text-xs focus:outline-none"
              />
              {errors.idFile && <span className="text-red-400 text-xs mt-1">{errors.idFile}</span>}
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="mt-1 accent-red-500 rounded cursor-pointer"
            />
            <label htmlFor="termsAccepted" className="text-gray-400 text-xs font-thin cursor-pointer">
              I agree to the{' '}
              <a href="#terms" className="text-blue-500 hover:underline">
                Terms and Conditions
              </a>{' '}
              and Privacy Policy of ResQ:Biñan.
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-red-400 text-xs mb-4 -mt-4">{errors.termsAccepted}</p>
          )}

          {/* Submit Button with 3s Rate Limiting */}
          <button
            type="submit"
            disabled={cooldown > 0 || isSubmitting}
            className={`w-full text-white font-bold py-2.5 px-4 rounded focus:outline-none transition-colors duration-300 ${
              cooldown > 0 || isSubmitting
                ? 'bg-red-800/50 cursor-not-allowed text-gray-400'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {cooldown > 0 ? `Please wait (${cooldown}s)...` : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-800 pt-4">
          <p className="text-gray-400 text-sm font-thin">
            Already have an account?{' '}
            <a href="/" className="text-blue-500 hover:underline font-normal">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp