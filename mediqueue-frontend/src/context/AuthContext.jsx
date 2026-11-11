import { createContext, useContext, useState, useCallback } from 'react'
import { loginUser, registerUser } from '../api/authApi'
import { TOKEN_KEY, USER_KEY } from '../api/axiosInstance'

const AuthContext = createContext(null)

function store(data) {
  const userData = { token: data.token, userId: data.userId, username: data.username, name: data.name, role: data.role }
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

  /**
   * Returns the server response. When the account needs administrator approval there is no
   * token: nothing is stored and the caller shows res.message instead of logging in.
   */
  const register = useCallback(async (payload) => {
    const res = await registerUser(payload)
    if (!res.data?.token) return res.data
    const userData = store(res.data)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
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
