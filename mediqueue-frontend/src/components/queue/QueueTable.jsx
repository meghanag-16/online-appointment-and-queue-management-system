import StatusBadge from '../common/StatusBadge'
import { formatTime } from '../../utils/dates'

/**
 * One doctor's queue for a day. Columns are shared; the actions column is supplied by the page
 * (doctor: call/start/finish; front desk: priority; administrator: move up/down).
 *
 * Props: entries, renderActions(entry) → node, emptyText
 */
export default function QueueTable({ entries, renderActions, emptyText = 'Nobody in the queue.' }) {
  const active = entries.filter(e => e.visitStatus !== 'FINISHED')
  const finished = entries.filter(e => e.visitStatus === 'FINISHED')
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-wrapper">
        <table data-testid="queue-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Patient</th>
              <th>Slot</th>
              <th>Reason</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
                  {emptyText}
                </td>
              </tr>
            )}
            {active.map(e => (
              <tr key={e.queueId} style={rowStyle(e)} data-testid={`queue-row-${e.appointmentId}`}>
                <td style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {e.queuePosition}
                  {e.overridePosition != null && (
                    <span title="Position set by the administrator" style={{ fontSize: 11, marginLeft: 4 }}>
                      📌
                    </span>
                  )}
                </td>
                <td>
                  <strong>{e.patientName}</strong>
                </td>
                <td style={{ fontSize: 12 }}>
                  {e.slotStart ? `${formatTime(e.slotStart)} – ${formatTime(e.slotEnd)}` : '—'}
                </td>
                <td style={{ fontSize: 12, maxWidth: 180 }}>{e.reasonForVisit || '—'}</td>
                <td>
                  <StatusBadge status={e.priority || 'NORMAL'} />
                </td>
                <td>
                  <StatusBadge status={e.visitStatus} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{renderActions(e)}</td>
              </tr>
            ))}
            {finished.length > 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ background: 'var(--color-bg)', fontSize: 12, color: 'var(--color-text-muted)' }}
                >
                  Seen today ({finished.length})
                </td>
              </tr>
            )}
            {finished.map(e => (
              <tr key={e.queueId} style={{ opacity: 0.7 }}>
                <td>—</td>
                <td>{e.patientName}</td>
                <td style={{ fontSize: 12 }}>{e.slotStart ? formatTime(e.slotStart) : '—'}</td>
                <td style={{ fontSize: 12 }}>{e.reasonForVisit || '—'}</td>
                <td>
                  <StatusBadge status={e.priority || 'NORMAL'} />
                </td>
                <td>
                  <StatusBadge status="FINISHED" />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{renderActions(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const rowStyle = e => ({
  background: e.visitStatus === 'IN_CONSULTATION' ? '#f6efff' : e.visitStatus === 'CALLED' ? '#fff8ec' : undefined,
})
