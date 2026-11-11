import { useEffect, useRef, useState } from 'react'
import { getMyNotifications, markNotificationAsRead, markAllNotificationsRead } from '../../api/notificationApi'
import { usePolling } from '../../hooks/usePolling'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { formatDateTime, formatEnum } from '../../utils/formatters'
import Button from '../ui/Button'
import { EmptyState } from '../ui/States'

/** Bell in the top bar: unread count, and a list of the latest notifications. Refreshes every 30 seconds. */
export default function NotificationBell() {
  const [inbox, setInbox] = useState({ unreadCount: 0, items: [] })
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  useEscapeKey(() => setOpen(false))

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
    <div ref={boxRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        data-testid="notification-bell"
        className="relative"
        onClick={() => {
          setOpen(o => !o)
          if (!open) load()
        }}
      >
        🔔
        {unread > 0 && (
          <span className="count-dot" data-testid="notification-count">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="row-between panel-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAll}>
                Mark all read
              </Button>
            )}
          </div>
          {inbox.items.length === 0 && <EmptyState icon="🔕" title="No notifications yet" />}
          {inbox.items.map(n => (
            <button
              type="button"
              key={n.notificationId}
              onClick={() => markRead(n)}
              data-testid={`notification-${n.notificationId}`}
              title={n.read ? undefined : 'Mark as read'}
              className={`notification-item ${n.read ? '' : 'is-unread'}`}
            >
              <span className="row-between text-xs muted">
                <span className="strong">{formatEnum(n.type)}</span>
                <span>{formatDateTime(n.timestamp)}</span>
              </span>
              <span className="block text-sm">{n.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
