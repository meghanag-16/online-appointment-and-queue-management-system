import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useEffect, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import Spinner from '../common/Spinner'
import StatusBadge from '../common/StatusBadge'
import { formatDate, formatEnum } from '../../utils/formatters'
import { formatTime } from '../../utils/dates'

/**
 * A patient's clinical history for the treating doctor: basics, allergies, medical record,
 * prescriptions and past visits. Props: patientId, patientName, onClose()
 */
export default function PatientHistoryDialog({ patientId, patientName, onClose }) {
  const [history, setHistory] = useState(null)
  const [error, setError] = useState('')
  useEscapeKey(onClose)

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.PATIENT_HISTORY(patientId))
      .then(res => setHistory(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load the patient history.')))
  }, [patientId])

  return (
    <div style={overlay} role="presentation" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="card"
        style={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        data-testid="patient-history"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 id="history-title" style={{ margin: 0 }}>
            Patient history — {history?.name || patientName}
          </h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {!history && !error && <Spinner />}
        {history && (
          <>
            <div style={grid}>
              <Fact
                label="Age / Gender"
                value={[history.age != null ? `${history.age} yrs` : null, history.gender && formatEnum(history.gender)]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <Fact label="Blood group" value={history.bloodGroup} />
              <Fact label="Phone" value={history.phoneNumber} />
              <Fact label="Emergency contact" value={history.emergencyContact} />
            </div>
            <div style={{ ...grid, marginTop: 8 }}>
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
                <Muted>None yet.</Muted>
              ) : (
                history.prescriptions.map(p => (
                  <div key={p.prescriptionId} style={item}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {formatDate(p.appointmentDate || p.issuedAt)} · {p.doctorName}
                    </div>
                    <div>
                      <strong>{p.diagnosisNotes}</strong>
                    </div>
                    <div style={{ fontSize: 13 }}>{p.medicationList}</div>
                    {p.advice && <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{p.advice}</div>}
                  </div>
                ))
              )}
            </Section>

            <Section title={`Visits (${history.visits.length})`}>
              {history.visits.length === 0 ? (
                <Muted>No visits.</Muted>
              ) : (
                history.visits.map(v => (
                  <div
                    key={v.appointmentId}
                    style={{ ...item, display: 'flex', justifyContent: 'space-between', gap: 8 }}
                  >
                    <span style={{ fontSize: 13 }}>
                      {formatDate(v.appointmentDate)} {v.startTime ? formatTime(v.startTime) : ''} · {v.doctorName}
                      {v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                ))
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function Fact({ label, value, warn }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 500, color: warn && value ? 'var(--color-danger)' : 'inherit' }}>{value || '—'}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  )
}

function Lines({ text }) {
  if (!text || text.startsWith('No ')) return <Muted>{text || 'Nothing recorded yet.'}</Muted>
  return text.split('\n').map((line, i) => (
    <div key={i} style={{ ...item, fontSize: 13 }}>
      {line}
    </div>
  ))
}

const Muted = ({ children }) => <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{children}</div>

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}
const panel = { width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }
const item = { padding: '6px 0', borderBottom: '1px solid var(--color-border)' }
