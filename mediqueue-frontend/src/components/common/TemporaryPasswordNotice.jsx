import { useState } from 'react'
import Button from '../ui/Button'

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
      <div className="row mt-2 mb-2">
        <code className="temp-password" data-testid="temp-password">
          {password}
        </code>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
      <small>It is shown only once. They will be asked to choose a new password the first time they log in.</small>
    </div>
  )
}
