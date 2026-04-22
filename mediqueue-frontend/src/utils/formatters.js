/**
 * Formats a date string or Date object to a readable local date.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/**
 * Formats a datetime string to date + time.
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Formats a number as Indian Rupees.
 */
export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Converts a SCREAMING_SNAKE_CASE enum value to Title Case.
 */
export function formatEnum(value) {
  if (!value) return '—'
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}
