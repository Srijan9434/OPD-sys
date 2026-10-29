import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach Bearer token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses and expired tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid / expired session
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const doctorApi = {
  // Auth
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => API.get('/auth/me'),

  // Doctor Operations
  getDashboard: () => API.get('/doctor/dashboard'),
  getAppointments: (params) => API.get('/doctor/appointments', { params }),
  updateStatus: (id, status, cancelReason) =>
    API.put(`/doctor/appointments/${id}/status`, { status, cancelReason }),
  savePrescription: (id, data) =>
    API.post(`/doctor/appointments/${id}/prescription`, data),
  markPaymentPaid: (id) => API.put(`/doctor/appointments/${id}/payment`),
  updateAvailability: (data) => API.put('/doctor/availability', data),
  getPatientHistory: (patientId) => API.get(`/doctor/patients/${patientId}/history`),
  emergencyLeave: (data) => API.post('/doctor/emergency-leave', data),
}

export default API
