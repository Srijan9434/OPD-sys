import React, { createContext, useContext, useState, useEffect } from 'react'
import adminApi from '../api/adminApi'

const AdminAuthContext = createContext(null)

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adminUser')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('adminToken')
      if (!storedToken) {
        setAdminUser(null)
        setLoading(false)
        return
      }

      try {
        const res = await adminApi.get('/auth/me')
        if (res.data?.success && res.data?.data?.role === 'admin') {
          setAdminUser(res.data.data)
          localStorage.setItem('adminUser', JSON.stringify(res.data.data))
        } else {
          logout()
        }
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = async (email, password) => {
    const res = await adminApi.post('/auth/login', { email, password })
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Login failed')
    }

    const { token: receivedToken, user } = res.data.data
    if (!user || user.role !== 'admin') {
      throw new Error(
        `Access denied: This account has role "${user?.role || 'unknown'}". Only authorized administrators can access this portal.`
      )
    }

    localStorage.setItem('adminToken', receivedToken)
    localStorage.setItem('adminUser', JSON.stringify(user))
    setToken(receivedToken)
    setAdminUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setToken(null)
    setAdminUser(null)
  }

  const value = {
    adminUser,
    token,
    isAuthenticated: Boolean(token && adminUser && adminUser.role === 'admin'),
    loading,
    login,
    logout,
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
