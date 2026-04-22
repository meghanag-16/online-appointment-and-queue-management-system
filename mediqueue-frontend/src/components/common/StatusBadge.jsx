import { formatEnum } from '../../utils/formatters'

const COLOR_MAP = {
  BOOKED:       { bg: '#e8f4fd', color: '#2980b9' },
  CONFIRMED:    { bg: '#e8f8ee', color: '#27ae60' },
  IN_PROGRESS:  { bg: '#fff3e0', color: '#e67e22' },
  COMPLETED:    { bg: '#e8f8ee', color: '#27ae60' },
  CANCELLED:    { bg: '#fde8e8', color: '#e74c3c' },
  NO_SHOW:      { bg: '#f5f5f5', color: '#7f8c8d' },
  PENDING:      { bg: '#fff3e0', color: '#e67e22' },
  PAID:         { bg: '#e8f8ee', color: '#27ae60' },
  FAILED:       { bg: '#fde8e8', color: '#e74c3c' },
  REFUNDED:     { bg: '#f0e6ff', color: '#8e44ad' },
  ACTIVE:       { bg: '#e8f8ee', color: '#27ae60' },
  SUSPENDED:    { bg: '#fff3e0', color: '#e67e22' },
  DEACTIVATED:  { bg: '#fde8e8', color: '#e74c3c' },
}

export default function StatusBadge({ status }) {
  const style = COLOR_MAP[status] || { bg: '#f5f5f5', color: '#555' }
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {formatEnum(status)}
    </span>
  )
}
