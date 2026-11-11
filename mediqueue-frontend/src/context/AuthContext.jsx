import { createContext, useContext, useState, useCallback } from 'react'
import { loginUser, registerUser } from '../api/authApi'
import { TOKEN_KEY, USER_KEY } from '../api/axiosInstance'

const AuthContext = createContext(null)

function store(data) {
  const userData = {
    token: data.token,
    userId: data.userId,
    username: data.username,
    name: data.name,
    role: data.role,
    mustChangePassword: !!data.mustChangePassword,
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(userData))
  return userData
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored && localStorage.getItem(TOKEN_KEY) ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (username, password) => {
    const res = await loginUser({ username, password })
    const userData = store(res.data)
    setUser(userData)
    return userData
  }, [])

  /** Patient sign-up; the new patient is logged in straight away. */
  const register = useCallback(async payload => {
    const res = await registerUser(payload)
    const userData = store(res.data)
    setUser(userData)
    return userData
  }, [])

  /** Keep the stored name in sync after the user edits their profile. */
  const updateUser = useCallback(changes => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...changes }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
