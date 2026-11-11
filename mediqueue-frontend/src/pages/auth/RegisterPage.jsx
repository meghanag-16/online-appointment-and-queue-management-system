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
    <div className="auth-screen">
      <div className="auth-panel is-wide animate-in">
        <div className="auth-head">
          <Link to="/" className="auth-logo" aria-label="MediQueue home">
            M
          </Link>
          <h1>Create Patient Account</h1>
          <p className="muted text-sm">Register to book appointments with MediQueue</p>
        </div>

        <UserProfileForm fixedRole="PATIENT" submitLabel="Register" onSubmit={handleRegister} />

        <p className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
