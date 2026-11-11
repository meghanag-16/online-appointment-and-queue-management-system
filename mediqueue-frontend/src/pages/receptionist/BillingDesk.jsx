import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { usePolling } from '../../hooks/usePolling'
import { drName, formatCurrency, formatDateTime, formatEnum } from '../../utils/formatters'
import {
  Alert,
  Button,
  Card,
  Cell,
  ErrorState,
  Input,
  LoadingState,
  Table,
  useConfirm,
  useToast,
} from '../../components/ui'

export const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'INSURANCE', 'NET_BANKING']
const FILTERS = [
  ['', 'All'],
  ['PENDING', 'Pending'],
  ['FAILED', 'Failed'],
  ['PAID', 'Paid'],
  ['REFUNDED', 'Refunded'],
  ['VOID', 'Void'],
]

/** Front desk billing: find a bill and mark it paid (with the method), failed or refunded. */
export default function BillingDesk() {
  const confirm = useConfirm()
  const toast = useToast()
  const [status, setStatus] = useState('PENDING')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('') // query, applied 300 ms after typing stops
  const [bills, setBills] = useState(null)
  const [methods, setMethods] = useState({})
  const [methodErrors, setMethodErrors] = useState({})
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  async function load() {
    try {
      const res = await axiosInstance.get(ENDPOINTS.BILLS_ALL(status, search))
      setBills(res.data)
      setLoadError('')
    } catch (err) {
      setBills([])
      setLoadError(errorMessage(err, 'Could not load bills.'))
    }
  }
  usePolling(load, 15000, [status, search])

  async function update(bill, paymentStatus) {
    setError('')
    const paymentMethod = methods[bill.billId] || ''
    if (paymentStatus === 'PAID' && !paymentMethod) {
      setMethodErrors(e => ({ ...e, [bill.billId]: 'Choose how it was paid' }))
      return
    }
    setMethodErrors(e => ({ ...e, [bill.billId]: '' }))
    if (paymentStatus === 'REFUNDED') {
      const ok = await confirm({
        title: `Refund ${formatCurrency(bill.totalAmount)}?`,
        message: `Bill #${bill.billId} for ${bill.patientName} will be marked refunded.`,
        confirmLabel: 'Refund',
        danger: true,
      })
      if (!ok) return
    }
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_PAYMENT(bill.billId), { paymentStatus, paymentMethod })
      toast.success(`Bill #${bill.billId} (${bill.patientName}) marked ${formatEnum(paymentStatus).toLowerCase()}.`)
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the bill.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Billing" subtitle="Collect payments and keep bills up to date" />
      <Alert tone="error">{error}</Alert>
      <ErrorState message={loadError} onRetry={load} />

      <div className="toolbar">
        <div className="row" role="group" aria-label="Filter by payment status">
          {FILTERS.map(([value, label]) => (
            <Button
              key={label}
              size="sm"
              variant={status === value ? 'primary' : 'outline'}
              onClick={() => setStatus(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Input
          id="bill-q"
          label="Search"
          fieldClassName="push-right"
          placeholder="Patient name or ID, bill or appointment #"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {bills === null ? (
        <LoadingState label="Loading bills…" />
      ) : (
        <Card flush>
          <Table
            headers={['Bill', 'Patient', 'Visit', 'Rule', 'Amount', 'Status', 'Action']}
            empty="No bills found"
            isEmpty={bills.length === 0}
          >
            {bills.map(b => (
              <tr key={b.billId} data-testid={`desk-bill-${b.billId}`}>
                <td>
                  <Cell main={`#${b.billId}`} sub={`Appt #${b.appointmentId}`} />
                </td>
                <td>
                  <Cell main={b.patientName} sub={b.patientId} />
                </td>
                <td>
                  <Cell
                    main={drName(b.doctorName)}
                    sub={`${formatDateTime(b.appointmentStart)} · ${formatEnum(b.appointmentStatus)}`}
                  />
                </td>
                <td title={b.billingRule}>
                  <StatusBadge status={b.billingStrategy} />
                </td>
                <td>
                  <strong>{formatCurrency(b.totalAmount)}</strong>
                </td>
                <td>
                  <StatusBadge status={b.paymentStatus} />
                  {b.paidAt && (
                    <span className="cell-sub">
                      {formatEnum(b.paymentMethod)}, {formatDateTime(b.paidAt)}
                    </span>
                  )}
                </td>
                <td className="nowrap">
                  {['PENDING', 'FAILED'].includes(b.paymentStatus) && (
                    <div className="row">
                      <select
                        aria-label={`Payment method for bill ${b.billId}`}
                        className="form-control form-control-inline"
                        aria-invalid={methodErrors[b.billId] ? true : undefined}
                        value={methods[b.billId] || ''}
                        onChange={e => setMethods(m => ({ ...m, [b.billId]: e.target.value }))}
                      >
                        <option value="">Method…</option>
                        {PAYMENT_METHODS.map(m => (
                          <option key={m} value={m}>
                            {formatEnum(m)}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => update(b, 'PAID')}>
                        Mark paid
                      </Button>
                      {b.paymentStatus === 'PENDING' && (
                        <Button variant="outline" size="sm" onClick={() => update(b, 'FAILED')}>
                          Failed
                        </Button>
                      )}
                      {methodErrors[b.billId] && <small className="form-error block">{methodErrors[b.billId]}</small>}
                    </div>
                  )}
                  {b.paymentStatus === 'PAID' && (
                    <Button variant="danger-outline" size="sm" onClick={() => update(b, 'REFUNDED')}>
                      Refund
                    </Button>
                  )}
                  {['REFUNDED', 'VOID'].includes(b.paymentStatus) && <small className="muted">Closed</small>}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </PageLayout>
  )
}
