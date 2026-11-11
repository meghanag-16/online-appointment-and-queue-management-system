import Badge from '../ui/Badge'
import { formatEnum } from '../../utils/formatters'

/** Which colour each status gets; anything not listed is neutral grey. */
const TONE = {
  BOOKED: 'info',
  CONFIRMED: 'success',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'neutral',
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  REFUNDED: 'purple',
  VOID: 'neutral',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  DEACTIVATED: 'danger',
  HIGH_PRIORITY: 'accent',
  NORMAL: 'neutral',
  WAITING: 'info',
  CALLED: 'warning',
  IN_CONSULTATION: 'purple',
  FINISHED: 'success',
  OPEN: 'warning',
  UNDER_REVIEW: 'info',
  RESOLVED: 'success',
  STANDARD: 'neutral',
  EMERGENCY: 'danger',
  FOLLOW_UP: 'success',
}

export default function StatusBadge({ status }) {
  if (!status) return null
  return <Badge tone={TONE[status] || 'neutral'}>{formatEnum(status)}</Badge>
}
