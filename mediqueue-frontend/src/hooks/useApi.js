import { useState, useCallback } from 'react'

/**
 * useApi — wraps an async API call with loading/error/data state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi()
 *   execute(() => axiosInstance.get(ENDPOINTS.DOCTORS))
 */
export function useApi() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const execute = useCallback(async (apiFn) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn()
      setData(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}
