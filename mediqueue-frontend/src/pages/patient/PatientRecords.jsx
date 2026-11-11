import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { Alert, Card, ErrorState, LoadingState } from '../../components/ui'

/** The patient's medical record. Doctors add to it each time they issue a prescription. */
export default function PatientRecords() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    axiosInstance
      .get(ENDPOINTS.PATIENT_RECORDS(user.userId))
      .then(res => setRecord(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load your medical record.')))
  }
  useEffect(load, [user.userId])

  return (
    <PageLayout>
      <PageTitle title="Medical Record" subtitle="Your consolidated health record" />
      <ErrorState message={error} onRetry={load} />
      {!record && !error && <LoadingState label="Loading your record…" />}
      {record && (
        <Card className="max-w-md stack">
          <Section title="Diagnoses" text={record.diagnoses} />
          <Section title="Treatment notes" text={record.observations} />
          <Alert tone="info" className="mb-0">
            Your record is updated by your doctor after each consultation. See the full details on{' '}
            <Link to="/patient/prescriptions">My Prescriptions</Link>.
          </Alert>
        </Card>
      )}
    </PageLayout>
  )
}

function Section({ title, text }) {
  const empty = !text || text.startsWith('No ')
  return (
    <section>
      <h3 className="mb-2">{title}</h3>
      {empty ? (
        <p className="muted">{text || 'Nothing recorded yet.'}</p>
      ) : (
        <div className="divider-list">
          {text.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </section>
  )
}
