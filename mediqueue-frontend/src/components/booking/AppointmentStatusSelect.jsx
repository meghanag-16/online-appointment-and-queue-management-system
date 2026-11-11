import { formatEnum } from '../../utils/formatters'

/**
 * Status dropdown that only offers the moves the server allows for this user
 * (appointment.allowedStatuses). Shows a dash when nothing can change.
 */
export default function AppointmentStatusSelect({ appointment, onChange, disabled }) {
  const options = appointment.allowedStatuses || []
  if (options.length === 0) return <span className="muted text-xs">—</span>
  return (
    <select
      value=""
      disabled={disabled}
      className="form-control form-control-inline"
      aria-label={`Change status of appointment ${appointment.appointmentId}`}
      onChange={e => e.target.value && onChange(appointment, e.target.value)}
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
