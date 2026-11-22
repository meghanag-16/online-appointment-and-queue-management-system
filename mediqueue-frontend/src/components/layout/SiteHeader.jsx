import { Link } from 'react-router-dom'
import Brand from './Brand'

export const SECTION_LINKS = [
  { id: 'services', label: 'Services' },
  { id: 'your-visit', label: 'Your visit' },
  { id: 'departments', label: 'Departments' },
  { id: 'contact', label: 'Contact' },
]

/**
 * Header for public pages. Only the landing page passes `showAccount`, which adds the
 * Sign in and Register links; every other page keeps the header free of them.
 * `onLanding` keeps section links on the same page instead of reloading it.
 */
export default function SiteHeader({ showAccount = false, onLanding = false, showSections = true }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        {showSections && (
          <nav className="site-nav" aria-label="Sections">
            {SECTION_LINKS.map(s => (
              <a key={s.id} href={onLanding ? `#${s.id}` : `/#${s.id}`}>
                {s.label}
              </a>
            ))}
          </nav>
        )}
        {showAccount && (
          <nav className="site-account" aria-label="Account">
            <Link to="/login" className="btn btn-ghost" data-testid="header-login">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-pill" data-testid="header-register">
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
