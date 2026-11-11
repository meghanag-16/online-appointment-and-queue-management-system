import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'
import UserProfileForm, { ALL_ROLES } from '../../components/forms/UserProfileForm'

/**
 * Public sign-up. Uses the same UserProfileForm (and backend RegisterRequest) as administrator
 * user creation, so self-registered and admin-created users have identical fields per role.
 * Patients can log in straight away; staff accounts wait for administrator approval.
 */
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [pendingMessage, setPendingMessage] = useState('')

  async function handleRegister(payload) {
    const result = await register(payload)
    if (result?.token) {
      navigate(getHomeForRole(result.role), { replace: true })
    } else if (result) {
      setPendingMessage(result.message ||
        'Account created. An administrator must approve it before you can log in.')
    }
  }

  const staffNote = (role) => role !== 'PATIENT'
    ? 'Staff accounts must be approved by an administrator before you can log in.'
    : null

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

        {pendingMessage ? (
          <div className="alert alert-success" role="status">
            {pendingMessage}{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>Go to sign in</Link>
          </div>
        ) : (
          <UserProfileForm
            roles={ALL_ROLES}
            submitLabel="Register"
            roleNote={staffNote}
            onSubmit={handleRegister}
          />
        )}

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
  padding: '40px 36px', width: '100%', maxWidth: 520,
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
