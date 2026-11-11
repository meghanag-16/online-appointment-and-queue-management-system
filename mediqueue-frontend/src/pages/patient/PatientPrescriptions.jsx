import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatDate } from '../../utils/formatters'
import { Card, EmptyState, ErrorState, LoadingState } from '../../components/ui'

/** The patient's prescriptions, newest first. */
export default function PatientPrescriptions() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    axiosInstance
      .get(ENDPOINTS.PRESCRIPTIONS_BY_PATIENT(user.userId))
      .then(res => setData(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load your prescriptions.')))
  }
  useEffect(load, [user.userId])

  return (
    <PageLayout>
      <PageTitle title="My Prescriptions" subtitle="Prescriptions issued by your doctors" />
      <ErrorState message={error} onRetry={load} />
      {!data && !error && <LoadingState label="Loading prescriptions…" />}
      {data && data.length === 0 && (
        <Card className="max-w-md">
          <EmptyState
            icon="💊"
            title="No prescriptions yet"
            description="They appear here as soon as your doctor issues one."
          />
        </Card>
      )}
      <div className="stack max-w-md">
        {data?.map(p => (
          <Card key={p.prescriptionId} data-testid="prescription-card">
            <div className="row-between mb-2">
              <strong>{p.doctorName}</strong>
              <span className="muted text-xs">
                Visit {formatDate(p.appointmentDate)} · issued {formatDate(p.issuedAt)}
              </span>
            </div>
            <Row label="Diagnosis" value={p.diagnosisNotes} />
            <Row label="Medications" value={p.medicationList} />
            {p.advice && <Row label="Advice" value={p.advice} />}
            {p.followUpDate && <Row label="Follow-up" value={formatDate(p.followUpDate)} />}
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}

function Row({ label, value }) {
  return (
    <div className="mb-2">
      <p className="muted text-xs">{label}</p>
      <p className="pre-line">{value}</p>
    </div>
  )
}
