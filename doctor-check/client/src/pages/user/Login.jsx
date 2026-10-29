import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    console.log('Login data:', form) // replace with API call later
  }

  return (
    <div className="mx-auto mt-12 max-w-md rounded-lg bg-white p-8 shadow">
      <h2 className="mb-6 text-2xl font-bold">Patient Login</h2>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="rounded border p-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="rounded border p-2"
        />
        <button className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700">
          Login
        </button>
      </form>

      <p className="mt-4 text-sm">
        New patient? <Link to="/register" className="text-blue-600">Register</Link>
      </p>
    </div>
  )
}