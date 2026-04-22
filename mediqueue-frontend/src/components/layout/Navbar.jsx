import { useAuth } from '../../context/AuthContext'
import { formatEnum } from '../../utils/formatters'

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 'var(--sidebar-w)', right: 0,
      height: 'var(--navbar-h)', background: 'var(--color-white)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 32px', gap: 16, zIndex: 100, boxShadow: 'var(--shadow-sm)',
    }}>
      {user && (
        <>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {user.username}
          </span>
          <span style={{
            background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
            padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
          }}>
            {formatEnum(user.role)}
          </span>
          <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
        </>
      )}
    </nav>
  )
}
