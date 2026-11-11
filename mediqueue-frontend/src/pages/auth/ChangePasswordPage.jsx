import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { getHomeForRole } from '../../utils/roleRoutes'

/**
 * Shown straight after login when the account still has the temporary password the administrator
 * gave out. Nothing else in the app can be used until a new password is chosen.
 */
export default function ChangePasswordPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirm) { setError('The new passwords do not match.'); return }
    setSaving(true)
    try {
      await axiosInstance.put(ENDPOINTS.ME_PASSWORD, { currentPassword: form.currentPassword, newPassword: form.newPassword })
      updateUser({ mustChangePassword: false })
      navigate(getHomeForRole(user?.role), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not change the password.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-dark) 0%, #3d3d3d 100%)', padding: 16 }}>
      <div className="animate-in" style={{ background: 'var(--color-white)', borderRadius: 16, padding: '36px 32px',
        width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.5rem', marginBottom: 6 }}>Choose a new password</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          Welcome{user?.name ? `, ${user.name}` : ''}. You signed in with a temporary password from the administrator.
          Please replace it with one only you know.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="cp-current">Temporary password</label>
            <input id="cp-current" type="password" className="form-control" autoComplete="current-password"
              value={form.currentPassword} onChange={set('currentPassword')} required />
          </div>
          <div className="form-group">
            <label htmlFor="cp-new">New password</label>
            <input id="cp-new" type="password" className="form-control" autoComplete="new-password" minLength={8}
              placeholder="At least 8 characters" value={form.newPassword} onChange={set('newPassword')} required />
          </div>
          <div className="form-group">
            <label htmlFor="cp-confirm">Confirm new password</label>
            <input id="cp-confirm" type="password" className="form-control" autoComplete="new-password" minLength={8}
              value={form.confirm} onChange={set('confirm')} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}
            style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
            {saving ? 'Saving…' : 'Save new password'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
            Log out
          </button>
        </p>
      </div>
    </div>
  )
}
