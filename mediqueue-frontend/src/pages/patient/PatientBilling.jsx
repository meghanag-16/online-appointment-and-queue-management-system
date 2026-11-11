import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { drName, formatCurrency, formatDateTime, formatEnum } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { Card, EmptyState, ErrorState, LoadingState } from '../../components/ui'

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

  function load() {
    setError('')
    axiosInstance
      .get(ENDPOINTS.BILL_BY_PATIENT(user.userId))
      .then(res => setBills(res.data || []))
      .catch(err => {
        setBills([])
        setError(errorMessage(err, 'Could not load your bills.'))
      })
  }
  useEffect(load, [user.userId])

  const owed = (bills || [])
    .filter(b => ['PENDING', 'FAILED'].includes(b.paymentStatus))
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)

  return (
    <PageLayout>
      <PageTitle title="Billing" subtitle="Your bills and payment status" />
      <ErrorState message={error} onRetry={load} />
      {bills === null ? (
        <LoadingState label="Loading bills…" />
      ) : (
        <div className="stack max-w-md">
          {bills.length > 0 && (
            <Card className="row-between">
              <span className="muted">Amount due</span>
              <strong className="text-lg" data-testid="amount-due">
                {formatCurrency(owed)}
              </strong>
            </Card>
          )}
          {bills.length === 0 && !error && (
            <Card>
              <EmptyState
                icon="🧾"
                title="No bills yet"
                description="A bill is created when you book an appointment."
              />
            </Card>
          )}
          {bills.map(bill => (
            <Card key={bill.billId} data-testid={`bill-${bill.billId}`}>
              <div className="row-between row-top">
                <div>
                  <p className="muted text-xs">
                    Bill #{bill.billId} · Appointment #{bill.appointmentId}
                  </p>
                  <p>
                    {drName(bill.doctorName)} · {formatDateTime(bill.appointmentStart)}
                    {bill.appointmentStatus && <span className="muted"> · {formatEnum(bill.appointmentStatus)}</span>}
                  </p>
                  <p className={`stat-value ${bill.paymentStatus === 'VOID' ? 'strike' : ''}`}>
                    {formatCurrency(bill.totalAmount)}
                  </p>
                  <div className="row">
                    <StatusBadge status={bill.paymentStatus} />
                    {bill.billingStrategy && <StatusBadge status={bill.billingStrategy} />}
                    <small className="muted">{bill.billingRule}</small>
                  </div>
                </div>
                <div className="text-right muted text-sm">
                  <p>Generated {formatDateTime(bill.generatedAt)}</p>
                  {bill.paidAt && (
                    <p>
                      Paid {formatDateTime(bill.paidAt)}
                      {bill.paymentMethod ? ` by ${formatEnum(bill.paymentMethod)}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm">{STATUS_NOTE[bill.paymentStatus]}</p>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
