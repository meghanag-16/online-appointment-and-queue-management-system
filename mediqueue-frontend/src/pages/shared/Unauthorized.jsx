import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import StatusShell from './StatusShell'

export default function Unauthorized() {
  return (
    <StatusShell>
      <div className="status-screen">
        <div className="status-icon">
          <Icon name="lock" size={40} />
        </div>
        <h1>Access Denied</h1>
        <p className="muted">You don&apos;t have permission to view this page.</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </StatusShell>
  )
}
