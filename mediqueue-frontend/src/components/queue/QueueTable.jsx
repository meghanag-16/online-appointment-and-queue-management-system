import StatusBadge from '../common/StatusBadge'
import { Card, Cell, Table } from '../ui'
import { formatTime } from '../../utils/dates'

const HEADERS = ['#', 'Patient', 'Slot', 'Reason', 'Priority', 'Status', 'Actions']

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
    <Card flush>
      <Table headers={HEADERS} testId="queue-table" empty={emptyText} isEmpty={entries.length === 0}>
        {active.length === 0 && (
          <tr>
            <td colSpan={HEADERS.length} className="text-center muted">
              {emptyText}
            </td>
          </tr>
        )}
        {active.map(e => (
          <tr key={e.queueId} className={rowClass(e)} data-testid={`queue-row-${e.appointmentId}`}>
            <td className="strong text-lg">
              {e.queuePosition}
              {e.overridePosition != null && (
                <span title="Position set by the administrator" className="text-xs">
                  {' '}
                  📌
                </span>
              )}
            </td>
            <td>
              <strong>{e.patientName}</strong>
            </td>
            <td className="text-sm nowrap">
              {e.slotStart ? `${formatTime(e.slotStart)} – ${formatTime(e.slotEnd)}` : '—'}
            </td>
            <td className="text-sm">{e.reasonForVisit || '—'}</td>
            <td>
              <StatusBadge status={e.priority || 'NORMAL'} />
            </td>
            <td>
              <StatusBadge status={e.visitStatus} />
            </td>
            <td className="nowrap">
              <div className="row">{renderActions(e)}</div>
            </td>
          </tr>
        ))}
        {finished.length > 0 && (
          <tr className="row-group">
            <td colSpan={HEADERS.length}>Seen today ({finished.length})</td>
          </tr>
        )}
        {finished.map(e => (
          <tr key={e.queueId} className="row-faded">
            <td>—</td>
            <td>
              <Cell main={e.patientName} />
            </td>
            <td className="text-sm">{e.slotStart ? formatTime(e.slotStart) : '—'}</td>
            <td className="text-sm">{e.reasonForVisit || '—'}</td>
            <td>
              <StatusBadge status={e.priority || 'NORMAL'} />
            </td>
            <td>
              <StatusBadge status="FINISHED" />
            </td>
            <td className="nowrap">
              <div className="row">{renderActions(e)}</div>
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

function rowClass(e) {
  if (e.visitStatus === 'IN_CONSULTATION') return 'row-active'
  if (e.visitStatus === 'CALLED') return 'row-called'
  return undefined
}
