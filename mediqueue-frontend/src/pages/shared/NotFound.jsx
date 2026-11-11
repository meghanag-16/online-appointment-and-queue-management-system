import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="status-screen">
      <div className="status-code">404</div>
      <h1>Page not found</h1>
      <p className="muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn btn-primary">
        Go Home
      </Link>
    </div>
  )
}
