import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
const navigate = useNavigate();
const auth = useAuth();

const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (event) => {
event.preventDefault();


if (!name.trim() || !email.trim() || !password) {
  toast.error('Please fill in all fields.');
  return;
}

if (password.length < 6) {
  toast.error('Password must contain at least 6 characters.');
  return;
}

try {
  setLoading(true);

  const response = await api.post('/auth/register', {
    name: name.trim(),
    email: email.trim(),
    password,
  });

  const result = response.data;

  if (!result.success || !result.data?.user || !result.data?.token) {
    toast.error(result.message || 'Registration failed.');
    return;
  }

  if (typeof auth.login !== 'function') {
    toast.error('Authentication setup needs fixing. Check AuthContext.jsx.');
    return;
  }

  auth.login(result.data.user, result.data.token);

  toast.success('Account created successfully!');
  navigate('/');
} catch (error) {
  console.error('Registration error:', error);

  toast.error(
    error.response?.data?.message || 'Could not create account.'
  );
} finally {
  setLoading(false);
}


};

return (
  <main className="relative z-10 flex min-h-[80vh] items-center justify-center bg-white px-4 py-10">
    <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
        Create Account
      </h1>
      <p className="mb-8 text-center text-sm text-gray-500">
        Register to book your doctor appointments.
      </p>

    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your full name"
          autoComplete="name"
          required
          className="block w-full cursor-text rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
          className="block w-full cursor-text rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
          autoComplete="new-password"
          minLength={6}
          required
          className="block w-full cursor-text rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>

    <p className="mt-6 text-center text-sm text-gray-600">
      Already have an account?{' '}
      <Link to="/login" className="font-semibold text-primary hover:underline">
        Login
      </Link>
    </p>
  </section>
</main>


);
}
