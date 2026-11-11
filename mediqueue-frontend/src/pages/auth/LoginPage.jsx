import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'
import { Alert, Button, Input } from '../../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  // Set by axiosInstance when a request came back 401 (session expired / account locked)
  const expiredReason = params.get('expired')
    ? params.get('reason') || 'Your session has expired. Please log in again.'
    : ''

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      navigate(user.mustChangePassword ? '/change-password' : getHomeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel animate-in">
        <div className="auth-head">
          <Link to="/" className="auth-logo" aria-label="MediQueue home">
            M
          </Link>
          <h1>MediQueue</h1>
          <p className="muted text-sm">Sign in to your account</p>
        </div>

        {!error && <Alert tone="info">{expiredReason}</Alert>}
        <Alert tone="error">{error}</Alert>

        <form onSubmit={handleSubmit}>
          <Input
            id="username"
            label="Username"
            placeholder="Enter your username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
            autoComplete="username"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the page is just this form
            autoFocus
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" block loading={loading} className="mt-2" data-testid="login-btn">
            Sign In
          </Button>
        </form>

        <p className="auth-foot">
          New patient? <Link to="/register">Register</Link>
        </p>
        <p className="auth-foot text-xs mt-2">
          Doctors and staff: sign in with the username and password given by the hospital administrator.
        </p>
      </div>
    </div>
  )
}
