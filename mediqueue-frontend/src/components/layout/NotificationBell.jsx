import { useEffect, useRef, useState } from 'react'
import { getMyNotifications, markNotificationAsRead, markAllNotificationsRead } from '../../api/notificationApi'
import { usePolling } from '../../hooks/usePolling'
import { formatDateTime, formatEnum } from '../../utils/formatters'

/** Bell in the top bar: unread count, and a list of the latest notifications. Refreshes every 30 seconds. */
export default function NotificationBell() {
  const [inbox, setInbox] = useState({ unreadCount: 0, items: [] })
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  async function load() {
    try {
      const res = await getMyNotifications(20)
      if (res?.data) setInbox(res.data)
    } catch {
      /* the bell never blocks the page */
    }
  }
  usePolling(load, 30000)

  useEffect(() => {
    if (!open) return
    const close = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function markRead(n) {
    if (n.read) return
    try {
      await markNotificationAsRead(n.notificationId)
      load()
    } catch {
      /* ignore */
    }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead()
      load()
    } catch {
      /* ignore */
    }
  }

  const unread = inbox.unreadCount || 0
  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        aria-label={`Notifications, ${unread} unread`}
        data-testid="notification-bell"
        onClick={() => {
          setOpen(o => !o)
          if (!open) load()
        }}
        style={{ position: 'relative' }}
      >
        🔔
        {unread > 0 && (
          <span
            data-testid="notification-count"
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: 'var(--color-accent)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            // fixed to the right edge so it never slides under the sidebar on narrow screens
            position: 'fixed',
            right: 16,
            top: 'calc(var(--navbar-h) + 4px)',
            width: 'min(360px, calc(100vw - var(--sidebar-w) - 32px))',
            maxHeight: 440,
            overflowY: 'auto',
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 300,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {inbox.items.length === 0 && (
            <p style={{ padding: 16, margin: 0, color: 'var(--color-text-muted)' }}>No notifications yet.</p>
          )}
          {inbox.items.map(n => (
            <button
              type="button"
              key={n.notificationId}
              onClick={() => markRead(n)}
              data-testid={`notification-${n.notificationId}`}
              title={n.read ? undefined : 'Mark as read'}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                border: 'none',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-border)',
                cursor: n.read ? 'default' : 'pointer',
                background: n.read ? 'transparent' : 'var(--color-accent-soft)',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: 2,
                }}
              >
                <span style={{ fontWeight: 600 }}>{formatEnum(n.type)}</span>
                <span>{formatDateTime(n.timestamp)}</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.85rem' }}>{n.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
