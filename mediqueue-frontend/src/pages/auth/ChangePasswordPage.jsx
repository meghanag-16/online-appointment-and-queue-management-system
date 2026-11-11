import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { getHomeForRole } from '../../utils/roleRoutes'
import { Alert, Button, Input } from '../../components/ui'

/**
 * Shown straight after login when the account still has the temporary password the administrator
 * gave out. Nothing else in the app can be used until a new password is chosen.
 */
export default function ChangePasswordPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }))
  const mismatch = form.confirm && form.newPassword !== form.confirm ? 'The new passwords do not match.' : ''

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (mismatch) return
    setSaving(true)
    try {
      await axiosInstance.put(ENDPOINTS.ME_PASSWORD, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      updateUser({ mustChangePassword: false })
      navigate(getHomeForRole(user?.role), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not change the password.'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel animate-in">
        <div className="auth-head">
          <h1>Choose a new password</h1>
          <p className="muted text-sm">
            Welcome{user?.name ? `, ${user.name}` : ''}. You signed in with a temporary password from the administrator.
            Please replace it with one only you know.
          </p>
        </div>
        <Alert tone="error">{error}</Alert>
        <form onSubmit={submit}>
          <Input
            id="cp-current"
            label="Temporary password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            required
            error={fieldErrors.currentPassword}
          />
          <Input
            id="cp-new"
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters"
            value={form.newPassword}
            onChange={set('newPassword')}
            required
            error={fieldErrors.newPassword}
          />
          <Input
            id="cp-confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirm}
            onChange={set('confirm')}
            required
            error={mismatch}
          />
          <Button type="submit" size="lg" block loading={saving} disabled={!!mismatch}>
            Save new password
          </Button>
        </form>
        <p className="auth-foot">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Log out
          </Button>
        </p>
      </div>
    </div>
  )
}
