import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'

/** The patient's medical record. Doctors add to it each time they issue a prescription. */
export default function PatientRecords() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.PATIENT_RECORDS(user.userId))
      .then(res => setRecord(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load your medical record.')))
  }, [user.userId])

  return (
    <PageLayout>
      <PageTitle title="Medical Record" subtitle="Your consolidated health record" />
      {error && <div className="alert alert-error">{error}</div>}
      {!record && !error && <Spinner />}
      {record && (
        <div className="card" style={{ maxWidth: 820 }}>
          <Section title="Diagnoses" text={record.diagnoses} />
          <Section title="Treatment notes" text={record.observations} />
          <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
            Your record is updated by your doctor after each consultation.
            See the full details on <Link to="/patient/prescriptions">My Prescriptions</Link>.
          </div>
        </div>
      )}
    </PageLayout>
  )
}

function Section({ title, text }) {
  const empty = !text || text.startsWith('No ')
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      {empty
        ? <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{text || 'Nothing recorded yet.'}</p>
        : text.split('\n').map((line, i) => (
          <p key={i} style={{ margin: 0, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>{line}</p>
        ))}
    </div>
  )
}
