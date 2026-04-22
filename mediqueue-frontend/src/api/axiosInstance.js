import axios from 'axios'

const BASE_URL = '/api/v1'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage on every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('mq_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear storage and redirect to login
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
