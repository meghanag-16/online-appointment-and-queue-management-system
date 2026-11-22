import { useAuth } from '../../context/AuthContext'
import { getHomeForRole } from '../../utils/roleRoutes'
import Button from '../ui/Button'
import Brand from './Brand'
import NotificationBell from './NotificationBell'

/** Header for signed-in pages: brand, notifications and the person's name. No sign-in or register links here. */
export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <header className="navbar">
      <Brand to={user ? getHomeForRole(user.role) : '/'} />
      {user && (
        <nav className="navbar-account" aria-label="Account">
          <NotificationBell />
          <span className="navbar-user" data-testid="navbar-user">
            {user.name || user.username}
          </span>
          <Button variant="outline" size="sm" onClick={logout} data-testid="logout-btn">
            Logout
          </Button>
        </nav>
      )}
    </header>
  )
}
