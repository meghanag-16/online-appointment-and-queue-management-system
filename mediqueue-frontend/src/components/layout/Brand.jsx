import { Link } from 'react-router-dom'

/** The MediQueue wordmark. `to` makes it a link (home page by default). */
export default function Brand({ to = '/', inverted = false }) {
  const content = (
    <>
      <span className="brand-mark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 4v16M4 12h16" strokeLinecap="round" />
        </svg>
      </span>
      <span>
        Medi<span className="text-accent">Queue</span>
      </span>
    </>
  )
  const className = `brand ${inverted ? 'is-inverted' : ''}`.trim()
  return to ? (
    <Link to={to} className={className} aria-label="MediQueue home">
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  )
}
