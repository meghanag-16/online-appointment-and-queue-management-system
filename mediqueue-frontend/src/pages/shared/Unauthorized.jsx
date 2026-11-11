import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="status-screen">
      <div className="status-icon" aria-hidden="true">
        🔒
      </div>
      <h1>Access Denied</h1>
      <p className="muted">You don&apos;t have permission to view this page.</p>
      <Link to="/" className="btn btn-primary">
        Go Home
      </Link>
    </div>
  )
}
