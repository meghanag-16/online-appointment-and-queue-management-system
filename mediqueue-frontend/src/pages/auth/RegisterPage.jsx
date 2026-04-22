import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'

const ROLES = ['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMINISTRATOR']

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  // ✅ ONLY CHANGE: added 3 fields
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'PATIENT',
    gender: '',
    phone: '',
    dob: ''
  })

  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // ✅ ONLY CHANGE: send extra fields
      const user = await register(form)
      navigate(getHomeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={outerStyle}>
      <div style={panelStyle} className="animate-in">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={logoStyle}>M</div>
          <h1 style={headingStyle}>Create Account</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Register to access MediQueue
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" placeholder="Your full name"
              value={form.name} onChange={set('name')} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Username</label>
              <input className="form-control" placeholder="username"
                value={form.username} onChange={set('username')} required />
            </div>
            <div className="form-group">
              <label htmlFor="role-select">Role</label>
              <select
                id="role-select"
                className="form-control"
                value={form.role}
                onChange={set('role')}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={set('password')} required minLength={8} />
          </div>

          {/* ✅ NEW FIELDS (ONLY ADDED, NOTHING MODIFIED) */}

          <div className="form-group">
            <label htmlFor="gender-select">Gender</label>
            <select
              id="gender-select"
              className="form-control"
              value={form.gender} onChange={set('gender')} required>
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="phone-input">Phone Number</label>
            <input
              id="phone-input"
              className="form-control"
              placeholder="Enter phone number"
              value={form.phone} onChange={set('phone')} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dob-input">Date of Birth</label>
            <input
              id="dob-input"
              className="form-control"
              type="date"
              value={form.dob} onChange={set('dob')} required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
            Sign in
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
  padding: '40px 36px', width: '100%', maxWidth: 480,
  boxShadow: 'var(--shadow-lg)',
}
const logoStyle = {
  width: 52, height: 52, borderRadius: 14,
  background: 'var(--color-accent)', color: '#fff',
  fontSize: '1.5rem', fontWeight: 700,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 10,
}
const headingStyle = {
  fontFamily: 'var(--font-display)', fontSize: '1.5rem',
  color: 'var(--color-dark)', fontWeight: 400, marginBottom: 4,
}