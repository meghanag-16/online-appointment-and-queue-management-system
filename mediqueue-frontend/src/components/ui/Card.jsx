import { Link } from 'react-router-dom'

/** A white panel. `flush` removes the padding (for tables); `title`/`actions` add a header row. */
export function Card({ title, subtitle, actions, flush = false, className = '', children, as: Tag = 'div', ...rest }) {
  return (
    <Tag className={['card', flush && 'card-flush', className].filter(Boolean).join(' ')} {...rest}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}

/** A dashboard number. tone: accent | success | danger | muted; `to` makes it a link. */
export function StatCard({ label, value, sub, tone, to, testId }) {
  const body = (
    <div
      className={['card', 'stat-card', to && 'card-hover', tone === 'accent' ? 'is-accent' : tone && `tone-${tone}`]
        .filter(Boolean)
        .join(' ')}
      data-testid={testId}
    >
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? 0}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
  return to ? (
    <Link to={to} className="stat-link">
      {body}
    </Link>
  ) : (
    body
  )
}
