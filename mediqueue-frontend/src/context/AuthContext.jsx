import { createContext, useContext, useState, useCallback } from 'react'
import axiosInstance from '../api/axiosInstance'
import { ENDPOINTS } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mq_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (username, password) => {
    const res = await axiosInstance.post(ENDPOINTS.LOGIN, { username, password })
    const { token, userId, role } = res.data
    const userData = { token, userId, username, role }
    localStorage.setItem('mq_token', token)
    localStorage.setItem('mq_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (payload) => {
    const res = await axiosInstance.post(ENDPOINTS.REGISTER, payload)
    const { token, userId, username, role } = res.data
    const userData = { token, userId, username, role }
    localStorage.setItem('mq_token', token)
    localStorage.setItem('mq_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mq_token')
    localStorage.removeItem('mq_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
