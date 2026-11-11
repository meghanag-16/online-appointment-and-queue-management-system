import { useEffect, useState } from 'react'
import { ACCESS_DENIED_EVENT } from '../../api/axiosInstance'
import Button from '../ui/Button'

/**
 * Shows "Access Denied" whenever any API call returns 403 (logged in, but not allowed).
 * axiosInstance raises the event, so pages don't each need their own 403 handling.
 */
export default function AccessDeniedBanner() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onDenied = e => setMessage(e.detail || 'You do not have permission to do that.')
    window.addEventListener(ACCESS_DENIED_EVENT, onDenied)
    return () => window.removeEventListener(ACCESS_DENIED_EVENT, onDenied)
  }, [])

  if (!message) return null
  return (
    <div className="alert alert-error row-between" role="alert">
      <span>
        <strong>Access Denied.</strong> {message}
      </span>
      <Button variant="danger-outline" size="sm" onClick={() => setMessage('')}>
        Dismiss
      </Button>
    </div>
  )
}
