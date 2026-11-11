import { useEffect, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import StatusBadge from '../common/StatusBadge'
import { ErrorState, LoadingState, Modal } from '../ui'
import { formatDate, formatEnum } from '../../utils/formatters'
import { formatTime } from '../../utils/dates'

/**
 * A patient's clinical history for the treating doctor: basics, allergies, medical record,
 * prescriptions and past visits. Props: patientId, patientName, onClose()
 */
export default function PatientHistoryDialog({ patientId, patientName, onClose }) {
  const [history, setHistory] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.PATIENT_HISTORY(patientId))
      .then(res => setHistory(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load the patient history.')))
  }, [patientId])

  return (
    <Modal
      size="lg"
      title={`Patient history — ${history?.name || patientName}`}
      onClose={onClose}
      testId="patient-history"
    >
      <ErrorState message={error} />
      {!history && !error && <LoadingState label="Loading history…" />}
      {history && (
        <div className="stack">
          <div className="grid-auto">
            <Fact
              label="Age / Gender"
              value={[history.age != null ? `${history.age} yrs` : null, history.gender && formatEnum(history.gender)]
                .filter(Boolean)
                .join(' · ')}
            />
            <Fact label="Blood group" value={history.bloodGroup} />
            <Fact label="Phone" value={history.phoneNumber} />
            <Fact label="Emergency contact" value={history.emergencyContact} />
            <Fact label="Allergies" value={history.allergies} warn />
            <Fact label="Chronic conditions" value={history.chronicConditions} warn />
          </div>

          <Section title="Diagnoses (medical record)">
            <Lines text={history.diagnoses} />
          </Section>
          <Section title="Treatment notes">
            <Lines text={history.observations} />
          </Section>

          <Section title={`Prescriptions (${history.prescriptions.length})`}>
            {history.prescriptions.length === 0 ? (
              <p className="muted text-sm">None yet.</p>
            ) : (
              <div className="divider-list">
                {history.prescriptions.map(p => (
                  <div key={p.prescriptionId}>
                    <p className="muted text-xs">
                      {formatDate(p.appointmentDate || p.issuedAt)} · {p.doctorName}
                    </p>
                    <p className="strong">{p.diagnosisNotes}</p>
                    <p className="text-sm">{p.medicationList}</p>
                    {p.advice && <p className="text-sm muted">{p.advice}</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Visits (${history.visits.length})`}>
            {history.visits.length === 0 ? (
              <p className="muted text-sm">No visits.</p>
            ) : (
              <div className="divider-list">
                {history.visits.map(v => (
                  <div key={v.appointmentId} className="row-between">
                    <span className="text-sm">
                      {formatDate(v.appointmentDate)} {v.startTime ? formatTime(v.startTime) : ''} · {v.doctorName}
                      {v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </Modal>
  )
}

function Fact({ label, value, warn }) {
  return (
    <div>
      <p className="muted text-xs">{label}</p>
      <p className={warn && value ? 'strong text-danger' : 'strong'}>{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <p className="strong mb-2">{title}</p>
      {children}
    </section>
  )
}

function Lines({ text }) {
  if (!text || text.startsWith('No ')) return <p className="muted text-sm">{text || 'Nothing recorded yet.'}</p>
  return (
    <div className="divider-list text-sm">
      {text.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  )
}
