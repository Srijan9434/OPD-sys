import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'HOME' },
  { to: '/doctors', label: 'ALL DOCTORS' },
  { to: '/about', label: 'ABOUT' },
  { to: '/contact', label: 'CONTACT' },
  { to: '/my-appointments', label: 'MY APPOINTMENTS' },
]

export default function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-gray-300 py-4">
      <Link to="/" className="flex items-center gap-2 text-2xl font-semibold text-indigo-950">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">+</span>
        OPD Connect
      </Link>
      <nav className="hidden gap-6 text-sm font-medium md:flex">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `border-b-2 py-1 ${isActive ? 'border-primary' : 'border-transparent'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Link to="/register" className="rounded-full bg-primary px-6 py-2.5 text-sm text-white">
        Create account
      </Link>
    </header>
  )
}