import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { doctorApi } from '../../api/doctorApi'

export default function DoctorLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const emailTrimmed = form.email.trim()
    if (!emailTrimmed || !form.password) {
      return toast.error('Please enter both email and password.')
    }

    setLoading(true)
    try {
      const res = await doctorApi.login({
        email: emailTrimmed,
        password: form.password,
      })

      const { success, data, message } = res.data

      if (!success || !data?.token || !data?.user) {
        return toast.error(message || 'Login failed. Please check your credentials.')
      }

      // Strictly verify that the authenticated user has the doctor role
      if (data.user.role !== 'doctor') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return toast.error(
          'Access denied: This portal is reserved for doctors only. Patients must log in via the Patient Portal (port 5173).'
        )
      }

      // Save token and user profile
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      toast.success(`Welcome back, Dr. ${data.user.name}!`)
      navigate('/doctor/dashboard')
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Make sure the server is running on port 5000.'
          : 'Invalid email or password.')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Doc<span className="text-primary">Panel</span>
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Doctor Portal
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with your verified doctor credentials to access your OPD dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-gray-700"
            >
              Doctor Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="doctor@hospital.com"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In to Doctor Portal'}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-500">
          <p>Need doctor onboarding or account access?</p>
          <p className="font-medium text-gray-700 mt-0.5">Contact the Hospital Administration</p>
        </div>
      </div>
    </div>
  )
}
