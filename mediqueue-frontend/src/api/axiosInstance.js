import axios from 'axios'

/**
 * The ONE API client for the whole app. Every request goes through here so that:
 *  - the JWT is always attached,
 *  - 401 (missing/expired login) logs the user out and sends them to the login page,
 *  - 403 (logged in but not allowed) shows the "Access Denied" banner,
 *  - every error carries a readable message in err.userMessage.
 * Never call fetch() or axios directly with http://localhost:8080 — use this instead.
 */
/**
 * The API address, set at build time (see vite.config.js). A bare host such as
 * "mediqueue-api.onrender.com" becomes "https://mediqueue-api.onrender.com/api/v1".
 */
export function resolveApiBase(raw) {
  const value = (raw || '').trim().replace(/\/+$/, '')
  if (!value) return '/api/v1'
  if (value.startsWith('/')) return value
  const withScheme = /^https?:\/\//.test(value) ? value : `https://${value}`
  return withScheme.endsWith('/api/v1') ? withScheme : `${withScheme}/api/v1`
}

const BASE_URL = resolveApiBase(typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : '/api/v1')

export const TOKEN_KEY = 'mq_token'
export const USER_KEY = 'mq_user'
export const ACCESS_DENIED_EVENT = 'mq:access-denied'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage on every request
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Best human-readable message for a failed request. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data
  if (data?.error) return data.error
  if (typeof data === 'string' && data.trim()) return data
  if (err?.response?.status === 413) return 'File is too large (maximum 10 MB)'
  if (isServerUnreachable(err)) return SERVER_UNREACHABLE
  return err?.message || fallback
}

export const SERVER_UNREACHABLE = 'Cannot reach the server right now. Please try again in a moment.'

/**
 * No answer from the API: either no response at all, or an empty 5xx from a proxy in front of it
 * (the Vite dev proxy and nginx answer 500/502/503/504 with no body when the backend is down).
 */
export function isServerUnreachable(err) {
  const res = err?.response
  if (err?.request && !res) return true
  return !!res && res.status >= 500 && !res.data?.error && !(typeof res.data === 'string' && res.data.trim())
}

const isAuthCall = config => /\/auth\/(login|register)$/.test(config?.url || '')

axiosInstance.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    err.userMessage = errorMessage(err)

    // 401 on a normal call = session missing/expired → log out and go to login.
    // (A wrong password on the login form is also 401, but must stay on the page.)
    if (status === 401 && !isAuthCall(err.config)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      const reason = encodeURIComponent(err.userMessage || 'Your session has expired. Please log in again.')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign(`/login?expired=1&reason=${reason}`)
      }
    }

    // 403 PASSWORD_CHANGE_REQUIRED = still on the administrator's temporary password.
    if (status === 403 && err.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
      try {
        const stored = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
        if (stored) localStorage.setItem(USER_KEY, JSON.stringify({ ...stored, mustChangePassword: true }))
      } catch {
        /* ignore */
      }
      if (!window.location.pathname.startsWith('/change-password')) window.location.assign('/change-password')
      return Promise.reject(err)
    }

    // 403 = logged in but not allowed → tell the page layout to show the Access Denied banner.
    if (status === 403 && !isAuthCall(err.config)) {
      window.dispatchEvent(new CustomEvent(ACCESS_DENIED_EVENT, { detail: err.userMessage }))
    }

    return Promise.reject(err)
  },
)

export default axiosInstance
