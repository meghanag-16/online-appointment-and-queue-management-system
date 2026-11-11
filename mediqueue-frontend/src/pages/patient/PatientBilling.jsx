import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { drName, formatCurrency, formatDateTime, formatEnum } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'

const STATUS_NOTE = {
  PENDING: 'Please pay at the front desk.',
  FAILED: 'The last payment attempt failed. Please pay at the front desk.',
  PAID: 'Paid. Thank you.',
  REFUNDED: 'The visit was cancelled after payment; the amount has been refunded.',
  VOID: 'The visit was cancelled before payment; nothing is owed.',
}

/** The patient's bills. Each is created when the appointment is booked, priced by the rule shown. */
export default function PatientBilling() {
  const { user } = useAuth()
  const [bills, setBills] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.BILL_BY_PATIENT(user.userId))
      .then(res => setBills(res.data || []))
      .catch(err => {
        setBills([])
        setError(errorMessage(err, 'Could not load your bills.'))
      })
  }, [user.userId])

  const owed = (bills || [])
    .filter(b => ['PENDING', 'FAILED'].includes(b.paymentStatus))
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)

  return (
    <PageLayout>
      <PageTitle title="Billing" subtitle="Your bills and payment status" />
      {error && <div className="alert alert-error">{error}</div>}
      {bills === null ? (
        <Spinner />
      ) : (
        <div style={{ maxWidth: 760 }}>
          {bills.length > 0 && (
            <div
              className="card"
              style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>Amount due</span>
              <strong style={{ fontSize: '1.4rem' }} data-testid="amount-due">
                {formatCurrency(owed)}
              </strong>
            </div>
          )}
          {bills.length === 0 && (
            <div className="card">
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                No bills yet. A bill is created when you book an appointment.
              </p>
            </div>
          )}
          {bills.map(bill => (
            <div key={bill.billId} className="card" data-testid={`bill-${bill.billId}`} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Bill #{bill.billId} · Appointment #{bill.appointmentId}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    {drName(bill.doctorName)} · {formatDateTime(bill.appointmentStart)}
                    {bill.appointmentStatus && (
                      <>
                        {' '}
                        · <span style={{ color: 'var(--color-text-muted)' }}>{formatEnum(bill.appointmentStatus)}</span>
                      </>
                    )}
                  </p>
                  <p
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      margin: '4px 0',
                      color: 'var(--color-dark)',
                      textDecoration: bill.paymentStatus === 'VOID' ? 'line-through' : 'none',
                    }}
                  >
                    {formatCurrency(bill.totalAmount)}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={bill.paymentStatus} />
                    {bill.billingStrategy && <StatusBadge status={bill.billingStrategy} />}
                    <small style={{ color: 'var(--color-text-muted)' }}>{bill.billingRule}</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  <div>Generated {formatDateTime(bill.generatedAt)}</div>
                  {bill.paidAt && (
                    <div>
                      Paid {formatDateTime(bill.paidAt)}
                      {bill.paymentMethod ? ` by ${formatEnum(bill.paymentMethod)}` : ''}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '0.85rem' }}>{STATUS_NOTE[bill.paymentStatus]}</p>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
