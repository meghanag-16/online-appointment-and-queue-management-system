import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'
import UserProfileForm from '../../components/forms/UserProfileForm'

/**
 * Public sign-up — patients only. Doctors, lab technicians, receptionists and administrators
 * are created by the hospital administrator and sign in with the credentials they were given.
 */
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleRegister(payload) {
    const result = await register(payload)
    navigate(getHomeForRole(result.role), { replace: true })
  }

  return (
    <div style={outerStyle}>
      <div style={panelStyle} className="animate-in">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={logoStyle}>M</div>
          <h1 style={headingStyle}>Create Patient Account</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Register to book appointments with MediQueue
          </p>
        </div>

        <UserProfileForm fixedRole="PATIENT" submitLabel="Register" onSubmit={handleRegister} />

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
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--color-dark) 0%, #3d3d3d 100%)',
  padding: 16,
}
const panelStyle = {
  background: 'var(--color-white)',
  borderRadius: 16,
  padding: '40px 36px',
  width: '100%',
  maxWidth: 520,
  boxShadow: 'var(--shadow-lg)',
}
const logoStyle = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: 'var(--color-accent)',
  color: '#fff',
  fontSize: '1.5rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
}
const headingStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  color: 'var(--color-dark)',
  fontWeight: 400,
  marginBottom: 4,
}
