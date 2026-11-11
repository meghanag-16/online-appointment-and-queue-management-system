import { formatEnum } from '../../utils/formatters'

const COLOR_MAP = {
  BOOKED: { bg: '#e8f4fd', color: '#2980b9' },
  CONFIRMED: { bg: '#e8f8ee', color: '#27ae60' },
  IN_PROGRESS: { bg: '#fff3e0', color: '#e67e22' },
  COMPLETED: { bg: '#e8f8ee', color: '#27ae60' },
  CANCELLED: { bg: '#fde8e8', color: '#e74c3c' },
  NO_SHOW: { bg: '#f5f5f5', color: '#7f8c8d' },
  PENDING: { bg: '#fff3e0', color: '#e67e22' },
  PAID: { bg: '#e8f8ee', color: '#27ae60' },
  FAILED: { bg: '#fde8e8', color: '#e74c3c' },
  REFUNDED: { bg: '#f0e6ff', color: '#8e44ad' },
  ACTIVE: { bg: '#e8f8ee', color: '#27ae60' },
  SUSPENDED: { bg: '#fff3e0', color: '#e67e22' },
  DEACTIVATED: { bg: '#fde8e8', color: '#e74c3c' },
  HIGH_PRIORITY: { bg: '#fde8ef', color: '#e7557e' },
  WAITING: { bg: '#e8f4fd', color: '#2980b9' },
  CALLED: { bg: '#fff3e0', color: '#e67e22' },
  IN_CONSULTATION: { bg: '#f0e6ff', color: '#8e44ad' },
  FINISHED: { bg: '#e8f8ee', color: '#27ae60' },
  NORMAL: { bg: '#f0f0f0', color: '#666' },
  VOID: { bg: '#f0f0f0', color: '#7f8c8d' },
  OPEN: { bg: '#fff3e0', color: '#e67e22' },
  UNDER_REVIEW: { bg: '#e8f4fd', color: '#2980b9' },
  RESOLVED: { bg: '#e8f8ee', color: '#27ae60' },
  STANDARD: { bg: '#f0f0f0', color: '#555' },
  EMERGENCY: { bg: '#fde8e8', color: '#e74c3c' },
  FOLLOW_UP: { bg: '#e8f8ee', color: '#27ae60' },
}

export default function StatusBadge({ status }) {
  const style = COLOR_MAP[status] || { bg: '#f5f5f5', color: '#555' }
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: '0.78rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {formatEnum(status)}
    </span>
  )
}
