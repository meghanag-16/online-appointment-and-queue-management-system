import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import PatientHistoryDialog from '../../components/clinical/PatientHistoryDialog'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatDate } from '../../utils/formatters'
import { formatTime, todayLocal, toLocalDateString } from '../../utils/dates'

const EMPTY = { diagnosisNotes: '', medicationList: '', advice: '', followUpDate: '' }
const OPEN = ['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']

/**
 * Issue a prescription for one of your own appointments (today or earlier, not yet prescribed).
 * Issuing it completes the visit and adds the diagnosis to the patient's medical record.
 * ?appointmentId= preselects an appointment (from the queue).
 */
export default function DoctorPrescriptions() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedId, setSelectedId] = useState(params.get('appointmentId') || '')
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState(null)

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const [a, p] = await Promise.all([
        axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_DOCTOR(user.userId)),
        axiosInstance.get(ENDPOINTS.PRESCRIPTIONS_BY_DOCTOR(user.userId)),
      ])
      setAppointments(a.data); setPrescriptions(p.data)
    } catch (err) { setError(errorMessage(err, 'Could not load your appointments.')) }
  }

  // Appointments that can still get a prescription: today or earlier, not cancelled/no-show, none issued.
  const today = todayLocal()
  const pending = useMemo(() => appointments
    .filter(a => OPEN.includes(a.status) && !a.hasPrescription && a.appointmentDate && a.appointmentDate <= today)
    .sort((x, y) => (y.startTime || '').localeCompare(x.startTime || '')), [appointments, today])
  const selected = pending.find(a => String(a.appointmentId) === String(selectedId))

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!selected) { setError('Choose the appointment first.'); return }
    setSaving(true); setError(''); setMessage(''); setFieldErrors({})
    try {
      await axiosInstance.post(ENDPOINTS.PRESCRIPTIONS, {
        appointmentId: selected.appointmentId,
        diagnosisNotes: form.diagnosisNotes,
        medicationList: form.medicationList,
        advice: form.advice,
        followUpDate: form.followUpDate || null,
      })
      setMessage(`Prescription issued for ${selected.patientName}. The visit is completed and their medical record updated.`)
      setForm(EMPTY); setSelectedId('')
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not issue the prescription.'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally { setSaving(false) }
  }

  const fe = (n) => fieldErrors[n] ? <small style={{ color: 'var(--color-danger)' }}>{fieldErrors[n]}</small> : null
  const tomorrow = toLocalDateString(new Date(Date.now() + 86400000))

  return (
    <PageLayout>
      <PageTitle title="Prescriptions" subtitle="Issue prescriptions for your own appointments" />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form className="card" style={{ marginBottom: 20, maxWidth: 820 }} onSubmit={submit}>
        <h3 style={{ marginBottom: 12 }}>New prescription</h3>
        <div className="form-group">
          <label htmlFor="rx-appt">Appointment</label>
          <select id="rx-appt" className="form-control" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">{pending.length ? 'Choose an appointment…' : 'No appointments waiting for a prescription'}</option>
            {pending.map(a => (
              <option key={a.appointmentId} value={a.appointmentId}>
                {a.appointmentDate === today ? 'Today' : formatDate(a.appointmentDate)} {formatTime(a.startTime)} — {a.patientName}
                {a.reasonForVisit ? ` (${a.reasonForVisit})` : ''} · {a.status.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        {selected && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12,
            padding: '8px 12px', background: 'var(--color-accent-soft)', borderRadius: 8 }}>
            <span><strong>{selected.patientName}</strong> · <StatusBadge status={selected.status} /></span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setHistory(selected)}>View history</button>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="rx-diag">Diagnosis</label>
          <textarea id="rx-diag" className="form-control" rows={2} value={form.diagnosisNotes} onChange={set('diagnosisNotes')} required />
          {fe('diagnosisNotes')}
        </div>
        <div className="form-group">
          <label htmlFor="rx-meds">Medications</label>
          <textarea id="rx-meds" className="form-control" rows={3} placeholder="e.g. Paracetamol 500mg twice daily for 3 days"
            value={form.medicationList} onChange={set('medicationList')} required />
          {fe('medicationList')}
        </div>
        <div className="form-group">
          <label htmlFor="rx-advice">Advice (optional)</label>
          <textarea id="rx-advice" className="form-control" rows={2} value={form.advice} onChange={set('advice')} />
        </div>
        <div className="form-group" style={{ maxWidth: 240 }}>
          <label htmlFor="rx-follow">Follow-up date (optional)</label>
          <input id="rx-follow" type="date" className="form-control" min={tomorrow} value={form.followUpDate} onChange={set('followUpDate')} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || !selected}>{saving ? 'Saving…' : 'Issue prescription'}</button>
      </form>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Issued prescriptions</h3>
        {prescriptions.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>None yet.</p> : prescriptions.map(p => (
          <div key={p.prescriptionId} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong>{p.patientName}</strong>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(p.appointmentDate || p.issuedAt)} · #{p.appointmentId}</span>
            </div>
            <div style={{ fontSize: 13 }}><strong>Diagnosis:</strong> {p.diagnosisNotes}</div>
            <div style={{ fontSize: 13 }}><strong>Medications:</strong> {p.medicationList}</div>
            {p.advice && <div style={{ fontSize: 13 }}><strong>Advice:</strong> {p.advice}</div>}
            {p.followUpDate && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Follow-up: {formatDate(p.followUpDate)}</div>}
          </div>
        ))}
      </div>

      {history && <PatientHistoryDialog patientId={history.patientId} patientName={history.patientName} onClose={() => setHistory(null)} />}
    </PageLayout>
  )
}
