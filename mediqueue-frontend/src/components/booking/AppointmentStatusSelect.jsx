import { formatEnum } from '../../utils/formatters'

/**
 * Status dropdown that only offers the moves the server allows for this user
 * (appointment.allowedStatuses). Shows plain text when nothing can change.
 */
export default function AppointmentStatusSelect({ appointment, onChange, disabled }) {
  const options = appointment.allowedStatuses || []
  if (options.length === 0) return <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
  return (
    <select
      value=""
      disabled={disabled}
      aria-label={`Change status of appointment ${appointment.appointmentId}`}
      onChange={e => e.target.value && onChange(appointment, e.target.value)}
      style={{ padding: '4px 6px', borderRadius: 5, border: '1px solid var(--color-border)', fontSize: 12 }}
    >
      <option value="">Mark as…</option>
      {options.map(s => (
        <option key={s} value={s}>
          {formatEnum(s)}
        </option>
      ))}
    </select>
  )
}
