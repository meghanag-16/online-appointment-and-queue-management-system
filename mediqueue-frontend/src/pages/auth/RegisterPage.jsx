import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'
import UserProfileForm from '../../components/forms/UserProfileForm'
import PublicLayout from '../../components/layout/PublicLayout'

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
    <PublicLayout>
      <div className="auth-screen">
        <div className="auth-panel is-wide animate-in">
          <div className="auth-head">
            <h1>Create your patient account</h1>
            <p className="muted text-sm">Book visits, follow your turn and keep your records in one place.</p>
          </div>

          <UserProfileForm fixedRole="PATIENT" submitLabel="Register" onSubmit={handleRegister} />

          <p className="auth-foot">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
