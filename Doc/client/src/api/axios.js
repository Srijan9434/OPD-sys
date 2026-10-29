import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach Bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  // Only attach authorization header if calling the backend API
  const isTargetApi =
    !config.url?.startsWith('http') ||
    config.url?.startsWith('http://localhost:5000') ||
    config.url?.startsWith('http://127.0.0.1:5000')

  if (token && isTargetApi) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses and expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // If currently on an authenticated-only page, redirect to login
      if (window.location.pathname.startsWith('/my-appointments')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api