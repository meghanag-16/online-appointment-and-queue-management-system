import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatDate } from '../../utils/formatters'

/** The patient's prescriptions, newest first. */
export default function PatientPrescriptions() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.PRESCRIPTIONS_BY_PATIENT(user.userId))
      .then(res => setData(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load your prescriptions.')))
  }, [user.userId])

  return (
    <PageLayout>
      <PageTitle title="My Prescriptions" subtitle="Prescriptions issued by your doctors" />
      {error && <div className="alert alert-error">{error}</div>}
      {!data && !error && <Spinner />}
      {data && data.length === 0 && (
        <div className="card" style={{ color: 'var(--color-text-muted)' }}>
          No prescriptions yet. They appear here as soon as your doctor issues one.
        </div>
      )}
      {data &&
        data.map(p => (
          <div
            key={p.prescriptionId}
            className="card"
            style={{ marginBottom: 14, maxWidth: 820 }}
            data-testid="prescription-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <strong>{p.doctorName}</strong>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Visit {formatDate(p.appointmentDate)} · issued {formatDate(p.issuedAt)}
              </span>
            </div>
            <Row label="Diagnosis" value={p.diagnosisNotes} />
            <Row label="Medications" value={p.medicationList} pre />
            {p.advice && <Row label="Advice" value={p.advice} />}
            {p.followUpDate && <Row label="Follow-up" value={formatDate(p.followUpDate)} />}
          </div>
        ))}
    </PageLayout>
  )
}

function Row({ label, value, pre }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ whiteSpace: pre ? 'pre-wrap' : 'normal' }}>{value}</div>
    </div>
  )
}
