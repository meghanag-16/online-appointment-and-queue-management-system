import { useAuth } from '../../context/AuthContext'
import { formatEnum } from '../../utils/formatters'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <nav className="navbar" aria-label="Account">
      {user && (
        <>
          <NotificationBell />
          <span className="navbar-user">{user.name || user.username}</span>
          <Badge tone="accent">{formatEnum(user.role)}</Badge>
          <Button variant="outline" size="sm" onClick={logout} data-testid="logout-btn">
            Logout
          </Button>
        </>
      )}
    </nav>
  )
}
