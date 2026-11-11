/**
 * Date helpers that use the browser's LOCAL calendar day. Never use toISOString() for "today":
 * it is UTC, so in India it gives yesterday's date before 5:30 AM.
 */

/** YYYY-MM-DD of a Date in local time. */
export function toLocalDateString(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayLocal() {
  return toLocalDateString(new Date())
}

/** "2026-11-12T09:30:00" → "2026-11-12" (backend sends hospital-local times without a zone). */
export function datePart(isoDateTime) {
  return isoDateTime ? String(isoDateTime).slice(0, 10) : ''
}

/** "09:30 am" */
export function formatTime(isoDateTime) {
  if (!isoDateTime) return '—'
  return new Date(isoDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/** "Thu, 12 Nov" for a YYYY-MM-DD string. */
export function formatDayLabel(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = todayLocal()
  const tomorrow = toLocalDateString(new Date(Date.now() + 86400000))
  if (yyyyMmDd === today) return 'Today'
  if (yyyyMmDd === tomorrow) return 'Tomorrow'
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
}

/** "Thu, 12 Nov 2026, 09:30 am" */
export function formatSlot(isoDateTime) {
  if (!isoDateTime) return '—'
  return new Date(isoDateTime).toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
