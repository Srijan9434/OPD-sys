import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const links = [
{ to: '/', label: 'HOME' },
{ to: '/doctors', label: 'ALL DOCTORS' },
{ to: '/about', label: 'ABOUT' },
{ to: '/contact', label: 'CONTACT' },
{ to: '/my-appointments', label: 'MY APPOINTMENTS' },
];

export default function Navbar() {
const navigate = useNavigate();
const { user, logout } = useAuth();

const handleLogout = () => {
logout();
toast.success('Logged out successfully!');
navigate('/');
};

return ( <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-300 py-4">
    {/* Logo */}
    <Link
      to="/"
      className="flex items-center gap-2 text-2xl font-semibold text-indigo-950"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
        +
      </span>
      OPD Connect
    </Link>

    {/* Navigation links */}
    <nav className="hidden gap-6 text-sm font-medium md:flex">
    {links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.to === '/'}
        className={({ isActive }) =>
          `border-b-2 py-1 ${
            isActive ? 'border-primary' : 'border-transparent'
          }`
        }
      >
        {link.label}
      </NavLink>
    ))}
  </nav>

  {/* Authentication section */}
  <div className="flex items-center gap-4">
    {user ? (
      <>
        <span className="text-sm font-medium text-gray-700">
          Welcome, {user.name || user.fullName || user.email || 'User'} 👋
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-primary px-6 py-2.5 text-sm text-white transition hover:opacity-90"
        >
          Logout
        </button>
      </>
    ) : (
      <Link
        to="/register"
        className="rounded-full bg-primary px-6 py-2.5 text-sm text-white transition hover:opacity-90"
      >
        Create Account
      </Link>
    )}
  </div>
</header>

);
}
