import Button from './Button'

/** Shown while data loads. */
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner" data-testid="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/** Shown when there is nothing to list yet; `action` is an optional button or link. */
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state" data-testid="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      {title && <p className="empty-state-title">{title}</p>}
      {description && <p className="text-sm">{description}</p>}
      {action}
    </div>
  )
}

/** Shown when loading failed; `onRetry` adds a Try again button. */
export function ErrorState({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="alert alert-error" role="alert">
      {message}
      {onRetry && (
        <Button variant="danger-outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
