import axios from 'axios'

/**
 * The ONE API client for the whole app. Every request goes through here so that:
 *  - the JWT is always attached,
 *  - 401 (missing/expired login) logs the user out and sends them to the login page,
 *  - 403 (logged in but not allowed) shows the "Access Denied" banner,
 *  - every error carries a readable message in err.userMessage.
 * Never call fetch() or axios directly with http://localhost:8080 — use this instead.
 */
const BASE_URL = '/api/v1'

export const TOKEN_KEY = 'mq_token'
export const USER_KEY = 'mq_user'
export const ACCESS_DENIED_EVENT = 'mq:access-denied'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage on every request
axiosInstance.interceptors.request.use((config) => {
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
  if (err?.request && !err?.response) return 'Cannot reach the server. Is the backend running?'
  return err?.message || fallback
}

const isAuthCall = (config) => /\/auth\/(login|register)$/.test(config?.url || '')

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
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

    // 403 = logged in but not allowed → tell the page layout to show the Access Denied banner.
    if (status === 403 && !isAuthCall(err.config)) {
      window.dispatchEvent(new CustomEvent(ACCESS_DENIED_EVENT, { detail: err.userMessage }))
    }

    return Promise.reject(err)
  }
)

export default axiosInstance
