import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function DoctorNavbar() {
  const navigate = useNavigate()
  const doctorUser = JSON.parse(localStorage.getItem('user') || '{}')

  const navItems = [
    { label: 'Dashboard', path: '/doctor/dashboard' },
    { label: 'Appointments', path: '/doctor/appointments' },
    { label: 'Schedule & Availability', path: '/doctor/availability' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out of Doctor Portal')
    navigate('/login')
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-4 mb-8">
      <div className="flex items-center gap-3">
        <NavLink to="/doctor/dashboard" className="text-xl font-bold text-gray-800 tracking-tight">
          Doc<span className="text-primary">Panel</span>
        </NavLink>
        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
          Doctor Portal
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? 'text-primary border-b-2 border-primary pb-1'
                : 'text-gray-600 hover:text-gray-900 transition-colors'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-800">{doctorUser.name || 'Doctor'}</p>
          <p className="text-xs text-gray-400 capitalize">{doctorUser.role || 'Doctor'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
