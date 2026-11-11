import { useEffect, useId, useRef } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'

/**
 * A dialog over the page. Closes on Escape, on the close button and on a click outside the panel;
 * focus moves into it when it opens. size: sm | md | lg.
 */
export default function Modal({ title, subtitle, onClose, footer, size = 'md', testId, children }) {
  const titleId = useId()
  const panel = useRef(null)
  useEscapeKey(onClose)

  useEffect(() => {
    const previous = document.activeElement
    panel.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return (
    <div className="modal-backdrop" role="presentation" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        className={`card modal ${size !== 'md' ? `modal-${size}` : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
      >
        <div className="card-header">
          <div>
            <h3 id={titleId}>{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
