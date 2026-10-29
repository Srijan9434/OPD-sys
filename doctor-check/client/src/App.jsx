import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

import DoctorLogin from './pages/doctor/DoctorLogin'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorAvailability from './pages/doctor/DoctorAvailability'

// Route Guard to strictly enforce doctor authentication
function ProtectedDoctorRoute({ children }) {
  const token = localStorage.getItem('token')
  let user = null

  try {
    user = JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    user = null
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'doctor') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.error('Access restricted to doctors only. Please log in with a doctor account.')
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Toaster position="top-right" />
      <Routes>
        {/* Public Doctor Authentication */}
        <Route path="/login" element={<DoctorLogin />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />

        {/* Doctor Portal Routes (Guarded) */}
        <Route
          path="/"
          element={<Navigate to="/doctor/dashboard" replace />}
        />
        <Route
          path="/doctor"
          element={<Navigate to="/doctor/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedDoctorRoute>
              <DoctorDashboard />
            </ProtectedDoctorRoute>
          }
        />
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedDoctorRoute>
              <DoctorDashboard />
            </ProtectedDoctorRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedDoctorRoute>
              <DoctorAppointments />
            </ProtectedDoctorRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedDoctorRoute>
              <DoctorAppointments />
            </ProtectedDoctorRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedDoctorRoute>
              <DoctorAvailability />
            </ProtectedDoctorRoute>
          }
        />
        <Route
          path="/doctor/availability"
          element={
            <ProtectedDoctorRoute>
              <DoctorAvailability />
            </ProtectedDoctorRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
      </Routes>
    </div>
  )
}