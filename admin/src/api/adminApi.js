import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach stored JWT only to requests within the shared API domain
adminApi.interceptors.request.use(
  (config) => {
    const isApiRequest = !config.url?.startsWith('http') || config.url?.startsWith(API_BASE_URL)
    if (isApiRequest) {
      const token = localStorage.getItem('adminToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercept 401s and session expiration
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      const currentPath = window.location.pathname
      const loginPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login'
      if (!currentPath.endsWith('/login')) {
        window.location.href = loginPath
      }
    }
    return Promise.reject(error)
  }
)

export default adminApi
