import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { getAuditLogs } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { formatDateTime, formatEnum } from '../../utils/formatters'
import { Button, Card, Cell, ErrorState, Input, LoadingState, Select, Table } from '../../components/ui'

export const AUDIT_ACTIONS = [
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'QUEUE_POSITION_OVERRIDDEN',
  'USER_CREATED',
  'USER_STATUS_CHANGED',
  'DOCTOR_DETAILS_CHANGED',
  'PASSWORD_RESET',
  'COMPLAINT_RAISED',
  'COMPLAINT_STATUS_CHANGED',
  'BILL_PAYMENT_UPDATED',
  'BILL_REPRICED',
  'LAB_REPORT_UPLOADED',
  'SLOT_SETTINGS_CHANGED',
  'DEPARTMENT_ADDED',
  'ALERT_SENT',
]

const EMPTY = { action: '', from: '', to: '', q: '' }

/** Who did what, and when: bookings, cancellations, priority and queue overrides, account and complaint changes. */
export default function AdminAudit() {
  const [filters, setFilters] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setEntries(null)
    setError('')
    getAuditLogs({ ...applied, limit: 300 })
      .then(res => setEntries(res.data))
      .catch(err => {
        setEntries([])
        setError(errorMessage(err, 'Could not load the audit log.'))
      })
  }, [applied, reloadKey])

  const set = f => e => setFilters(v => ({ ...v, [f]: e.target.value }))
  const dateError = filters.from && filters.to && filters.to < filters.from ? '"To" is before "From"' : ''

  return (
    <PageLayout>
      <PageTitle title="Audit Log" subtitle="Key actions across the hospital, newest first" />
      <ErrorState message={error} onRetry={() => setReloadKey(k => k + 1)} />
      <Card className="mb-4">
        <form
          className="toolbar mb-0"
          onSubmit={e => {
            e.preventDefault()
            if (!dateError) setApplied(filters)
          }}
        >
          <Select
            id="au-action"
            label="Action"
            value={filters.action}
            onChange={set('action')}
            placeholder="All actions"
            options={AUDIT_ACTIONS.map(a => ({ value: a, label: formatEnum(a) }))}
          />
          <Input id="au-from" label="From" type="date" value={filters.from} onChange={set('from')} />
          <Input id="au-to" label="To" type="date" value={filters.to} onChange={set('to')} error={dateError} />
          <Input
            id="au-q"
            label="Search"
            placeholder="Person, record ID or detail"
            value={filters.q}
            onChange={set('q')}
          />
          <div className="row">
            <Button type="submit" disabled={!!dateError}>
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters(EMPTY)
                setApplied(EMPTY)
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>
      {entries === null ? (
        <LoadingState label="Loading audit log…" />
      ) : (
        <Card flush>
          <Table
            headers={['When', 'Who', 'Action', 'Record', 'Details']}
            empty="No entries match these filters"
            isEmpty={entries.length === 0}
          >
            {entries.map(e => (
              <tr key={e.auditId} data-testid={`audit-${e.auditId}`}>
                <td className="nowrap">{formatDateTime(e.createdAt)}</td>
                <td>
                  <Cell main={e.actorName} sub={formatEnum(e.actorRole)} />
                </td>
                <td className="text-sm strong">{formatEnum(e.action)}</td>
                <td className="text-sm">
                  {formatEnum(e.targetType)} {e.targetId}
                </td>
                <td className="text-sm">{e.details}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </PageLayout>
  )
}
