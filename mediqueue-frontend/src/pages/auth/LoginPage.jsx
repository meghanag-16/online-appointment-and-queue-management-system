import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      navigate(getHomeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={outerStyle}>
      <div style={panelStyle} className="animate-in">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={logoStyle}>M</div>
          <h1 style={headingStyle}>MediQueue</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Sign in to your account
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="form-control"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

const outerStyle = {
  minHeight: '100vh', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--color-dark) 0%, #3d3d3d 100%)',
  padding: 16,
}

const panelStyle = {
  background: 'var(--color-white)', borderRadius: 16,
  padding: '40px 36px', width: '100%', maxWidth: 420,
  boxShadow: 'var(--shadow-lg)',
}

const logoStyle = {
  width: 56, height: 56, borderRadius: 14,
  background: 'var(--color-accent)',
  color: 'var(--color-white)', fontSize: '1.6rem', fontWeight: 700,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 12,
}

const headingStyle = {
  fontFamily: 'var(--font-display)', fontSize: '1.6rem',
  color: 'var(--color-dark)', fontWeight: 400, marginBottom: 4,
}
