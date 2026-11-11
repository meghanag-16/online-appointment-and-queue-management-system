import { useState } from 'react'

/**
 * Shows a temporary password once, after the administrator creates an account or resets a password.
 * It is not stored anywhere readable, so it must be copied now and handed to the user.
 */
export default function TemporaryPasswordNotice({ name, username, password, onClose }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="alert alert-success" role="status" data-testid="temp-password-notice">
      <strong>{name}</strong> can now log in as <strong>{username}</strong> with this temporary password:
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
        <code
          data-testid="temp-password"
          style={{
            fontSize: '1.1rem',
            padding: '4px 10px',
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            letterSpacing: 1,
          }}
        >
          {password}
        </code>
        <button type="button" className="btn btn-outline btn-sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        {onClose && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Done
          </button>
        )}
      </div>
      <small>It is shown only once. They will be asked to choose a new password the first time they log in.</small>
    </div>
  )
}
