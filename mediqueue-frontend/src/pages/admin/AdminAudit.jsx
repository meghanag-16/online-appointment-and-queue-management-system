import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import { getAuditLogs } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { formatDateTime, formatEnum } from '../../utils/formatters'

export const AUDIT_ACTIONS = [
  'APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_STATUS_CHANGED',
  'PRIORITY_CHANGED', 'QUEUE_POSITION_OVERRIDDEN', 'USER_CREATED', 'USER_STATUS_CHANGED', 'PASSWORD_RESET',
  'COMPLAINT_RAISED', 'COMPLAINT_STATUS_CHANGED', 'BILL_PAYMENT_UPDATED', 'BILL_REPRICED',
  'LAB_REPORT_UPLOADED', 'SLOT_SETTINGS_CHANGED', 'DEPARTMENT_ADDED', 'ALERT_SENT',
]

/** Who did what, and when: bookings, cancellations, priority and queue overrides, account and complaint changes. */
export default function AdminAudit() {
  const [filters, setFilters] = useState({ action: '', from: '', to: '', q: '' })
  const [applied, setApplied] = useState(filters)
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setEntries(null); setError('')
    getAuditLogs({ ...applied, limit: 300 })
      .then(res => setEntries(res.data))
      .catch(err => { setEntries([]); setError(errorMessage(err, 'Could not load the audit log.')) })
  }, [applied])

  const set = (f) => (e) => setFilters(v => ({ ...v, [f]: e.target.value }))

  return (
    <PageLayout>
      <PageTitle title="Audit Log" subtitle="Key actions across the hospital, newest first" />
      {error && <div className="alert alert-error">{error}</div>}
      <form className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}
        onSubmit={e => { e.preventDefault(); setApplied(filters) }}>
        <div>
          <label htmlFor="au-action" style={{ display: 'block', fontSize: '0.8rem' }}>Action</label>
          <select id="au-action" className="form-control" value={filters.action} onChange={set('action')}>
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{formatEnum(a)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="au-from" style={{ display: 'block', fontSize: '0.8rem' }}>From</label>
          <input id="au-from" type="date" className="form-control" value={filters.from} onChange={set('from')} />
        </div>
        <div>
          <label htmlFor="au-to" style={{ display: 'block', fontSize: '0.8rem' }}>To</label>
          <input id="au-to" type="date" className="form-control" value={filters.to} onChange={set('to')} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="au-q" style={{ display: 'block', fontSize: '0.8rem' }}>Search</label>
          <input id="au-q" className="form-control" placeholder="Person, record ID or detail" value={filters.q} onChange={set('q')} />
        </div>
        <button type="submit" className="btn btn-primary">Apply</button>
        <button type="button" className="btn btn-outline" onClick={() => {
          const empty = { action: '', from: '', to: '', q: '' }; setFilters(empty); setApplied(empty)
        }}>Clear</button>
      </form>
      {entries === null ? <Spinner /> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No entries</td></tr>
                )}
                {entries.map(e => (
                  <tr key={e.auditId} data-testid={`audit-${e.auditId}`}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(e.createdAt)}</td>
                    <td>{e.actorName}<br /><small style={{ color: 'var(--color-text-muted)' }}>{formatEnum(e.actorRole)}</small></td>
                    <td><strong style={{ fontSize: '0.85rem' }}>{formatEnum(e.action)}</strong></td>
                    <td style={{ fontSize: '0.85rem' }}>{formatEnum(e.targetType)} {e.targetId}</td>
                    <td style={{ fontSize: '0.85rem' }}>{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
