import { useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { usePolling } from '../../hooks/usePolling'
import { drName, formatCurrency, formatDateTime, formatEnum } from '../../utils/formatters'

export const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'INSURANCE', 'NET_BANKING']
const FILTERS = [['', 'All'], ['PENDING', 'Pending'], ['FAILED', 'Failed'], ['PAID', 'Paid'], ['REFUNDED', 'Refunded'], ['VOID', 'Void']]

/** Front desk billing: find a bill and mark it paid (with the method), failed or refunded. */
export default function BillingDesk() {
  const [status, setStatus] = useState('PENDING')
  const [query, setQuery] = useState('')
  const [bills, setBills] = useState(null)
  const [methods, setMethods] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const res = await axiosInstance.get(ENDPOINTS.BILLS_ALL(status, query.trim()))
      setBills(res.data)
    } catch (err) { setBills([]); setError(errorMessage(err, 'Could not load bills.')) }
  }
  usePolling(load, 15000, [status, query])

  async function update(bill, paymentStatus) {
    setMessage(''); setError('')
    const paymentMethod = methods[bill.billId] || ''
    if (paymentStatus === 'PAID' && !paymentMethod) { setError(`Choose how bill #${bill.billId} was paid.`); return }
    if (paymentStatus === 'REFUNDED' && !window.confirm(`Refund ${formatCurrency(bill.totalAmount)} to ${bill.patientName}?`)) return
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_PAYMENT(bill.billId), { paymentStatus, paymentMethod })
      setMessage(`Bill #${bill.billId} (${bill.patientName}) marked ${formatEnum(paymentStatus).toLowerCase()}.`)
      load()
    } catch (err) { setError(errorMessage(err, 'Could not update the bill.')) }
  }

  return (
    <PageLayout>
      <PageTitle title="Billing" subtitle="Collect payments and keep bills up to date" />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {FILTERS.map(([value, label]) => (
          <button key={label} type="button" className={`btn btn-sm ${status === value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatus(value)}>{label}</button>
        ))}
        <label htmlFor="bill-q" className="sr-only">Search</label>
        <input id="bill-q" className="form-control" style={{ maxWidth: 300, marginLeft: 'auto' }}
          placeholder="Patient name or ID, bill or appointment #" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {bills === null ? <Spinner /> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Bill</th><th>Patient</th><th>Visit</th><th>Rule</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {bills.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No bills found</td></tr>
                )}
                {bills.map(b => (
                  <tr key={b.billId} data-testid={`desk-bill-${b.billId}`}>
                    <td>#{b.billId}<br /><small style={{ color: 'var(--color-text-muted)' }}>Appt #{b.appointmentId}</small></td>
                    <td>{b.patientName}<br /><small style={{ color: 'var(--color-text-muted)' }}>{b.patientId}</small></td>
                    <td>{drName(b.doctorName)}<br /><small style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(b.appointmentStart)} · {formatEnum(b.appointmentStatus)}</small></td>
                    <td title={b.billingRule}><StatusBadge status={b.billingStrategy} /></td>
                    <td><strong>{formatCurrency(b.totalAmount)}</strong></td>
                    <td>
                      <StatusBadge status={b.paymentStatus} />
                      {b.paidAt && <><br /><small style={{ color: 'var(--color-text-muted)' }}>{formatEnum(b.paymentMethod)}, {formatDateTime(b.paidAt)}</small></>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {['PENDING', 'FAILED'].includes(b.paymentStatus) && (
                        <>
                          <select aria-label={`Payment method for bill ${b.billId}`} className="form-control"
                            style={{ display: 'inline-block', width: 'auto', padding: '4px 8px', marginRight: 6 }}
                            value={methods[b.billId] || ''} onChange={e => setMethods(m => ({ ...m, [b.billId]: e.target.value }))}>
                            <option value="">Method…</option>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{formatEnum(m)}</option>)}
                          </select>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => update(b, 'PAID')}>Mark paid</button>{' '}
                          {b.paymentStatus === 'PENDING' && <button type="button" className="btn btn-outline btn-sm" onClick={() => update(b, 'FAILED')}>Failed</button>}
                        </>
                      )}
                      {b.paymentStatus === 'PAID' && <button type="button" className="btn btn-outline btn-sm" onClick={() => update(b, 'REFUNDED')}>Refund</button>}
                      {['REFUNDED', 'VOID'].includes(b.paymentStatus) && <small style={{ color: 'var(--color-text-muted)' }}>Closed</small>}
                    </td>
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
