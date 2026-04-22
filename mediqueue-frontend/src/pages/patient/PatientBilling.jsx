import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import axiosInstance from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'

export default function PatientBilling() {
  const { user } = useAuth()
  const [bills, setBills]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  // For manual lookup of a specific appointment
  const [apptId, setApptId]       = useState('')
  const [lookupBill, setLookup]   = useState(null)
  const [lookupErr, setLookupErr] = useState('')
  const [lookupLoading, setLL]    = useState(false)

  useEffect(() => {
    if (!user?.userId) return
    axiosInstance.get(ENDPOINTS.BILL_BY_PATIENT(user.userId))
      .then(res => setBills(res.data || []))
      .catch(() => setBills([]))
      .finally(() => setLoading(false))
  }, [user?.userId])

  async function lookup(e) {
    e.preventDefault()
    setLL(true); setLookupErr(''); setLookup(null)
    try {
      const res = await axiosInstance.get(ENDPOINTS.BILL_BY_APPT(apptId))
      setLookup(res.data)
      // refresh full list
      const allRes = await axiosInstance.get(ENDPOINTS.BILL_BY_PATIENT(user.userId))
      setBills(allRes.data || [])
    } catch (err) {
      setLookupErr(err.response?.data?.error || 'Could not find bill for that appointment.')
    } finally { setLL(false) }
  }

  const strategyColor = (s) => {
    if (!s) return 'var(--color-text-muted)'
    if (s === 'EMERGENCY') return '#e74c3c'
    if (s === 'FOLLOW_UP') return '#2ecc71'
    return 'var(--color-text-muted)'
  }

  return (
    <PageLayout>
      <PageTitle title="Billing" subtitle="Your bills and payment status" />

      {/* All bills */}
      {loading ? <Spinner /> : (
        <div style={{ maxWidth: 700, marginBottom: 32 }}>
          {bills.length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--color-text-muted)' }}>
                No bills found. Bills are generated automatically when you book an appointment.
              </p>
            </div>
          ) : (
            bills.map(bill => (
              <div key={bill.billId} className="card" style={{
                marginBottom: 16, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
              }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                    Bill #{bill.billId} · Appointment #{bill.appointmentId}
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-dark)', margin: '4px 0' }}>
                    {formatCurrency(bill.totalAmount)}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={bill.paymentStatus} />
                    {bill.billingStrategy && (
                      <span style={{ fontSize: '0.75rem', color: strategyColor(bill.billingStrategy),
                        fontWeight: 600, textTransform: 'uppercase' }}>
                        {bill.billingStrategy} rate
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                    Generated: {formatDateTime(bill.generatedAt)}
                  </p>
                  {bill.paymentMethod && (
                    <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                      Payment Method: {bill.paymentMethod}
                    </p>
                  )}
                </div>
                <div style={{
                  padding: '8px 16px', borderRadius: 8, textAlign: 'center',
                  background: bill.paymentStatus === 'PAID' ? '#eafaf1' : '#fdf0f4',
                  border: `1px solid ${bill.paymentStatus === 'PAID' ? '#2ecc71' : 'var(--color-accent)'}`,
                  minWidth: 90
                }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Status</p>
                  <p style={{ fontWeight: 700, margin: '2px 0 0',
                    color: bill.paymentStatus === 'PAID' ? '#27ae60' : 'var(--color-accent)' }}>
                    {bill.paymentStatus}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Manual lookup for appointment without a bill */}
      <div className="card" style={{ maxWidth: 500 }}>
        <h4 style={{ marginBottom: 12 }}>Look up bill by Appointment ID</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          If a bill isn't showing above, enter the appointment ID to generate it.
        </p>
        <form onSubmit={lookup} style={{ display: 'flex', gap: 10 }}>
          <input className="form-control" placeholder="Appointment ID"
            value={apptId} onChange={e => setApptId(e.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={lookupLoading}>
            {lookupLoading ? '…' : 'Look up'}
          </button>
        </form>
        {lookupErr && <div className="alert alert-error" style={{ marginTop: 10 }}>{lookupErr}</div>}
        {lookupBill && (
          <div style={{ marginTop: 12, padding: 12, background: '#fdf0f4', borderRadius: 8 }}>
            <p style={{ fontWeight: 600 }}>Bill #{lookupBill.billId} — {formatCurrency(lookupBill.totalAmount)}</p>
            <StatusBadge status={lookupBill.paymentStatus} />
          </div>
        )}
      </div>
    </PageLayout>
  )
}
