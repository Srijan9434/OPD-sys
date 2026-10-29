import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.success && data.data?.user && data.data?.token) {
        if (data.data.user.role !== 'user') {
          return toast.error(
            `Access restricted: Accounts with role "${data.data.user.role}" cannot access the patient portal. Please log in at the ${
              data.data.user.role === 'doctor' ? 'Doctor Portal (port 5174)' : 'Admin Portal (port 5175)'
            }.`
          )
        }
        login(data.data.user, data.data.token)
        toast.success(`Welcome back, ${data.data.user.name}!`)
        navigate('/')
      } else {
        toast.error(data.message || 'Login failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md rounded-xl border p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">Login</h2>
      <p className="mt-1 text-sm text-gray-500">Log in to book your appointment</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="rounded border p-2.5 text-sm"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="rounded border p-2.5 text-sm"
        />
        <button
          disabled={loading}
          className="rounded bg-primary p-2.5 text-white disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        New patient? <Link to="/register" className="text-primary">Create account</Link>
      </p>
    </div>
  )
}