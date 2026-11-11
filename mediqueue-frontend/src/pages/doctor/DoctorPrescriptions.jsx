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
import { Alert, Button, Card, EmptyState, Input, Select, Textarea, useToast } from '../../components/ui'

const EMPTY = { diagnosisNotes: '', medicationList: '', advice: '', followUpDate: '' }
const OPEN = ['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
const PAST_VISIT = ['IN_PROGRESS', 'COMPLETED']

/**
 * Issue a prescription for one of your own appointments (today or earlier, not yet prescribed).
 * Issuing it completes the visit and adds the diagnosis to the patient's medical record.
 * ?appointmentId= preselects an appointment (from the queue).
 */
export default function DoctorPrescriptions() {
  const { user } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedId, setSelectedId] = useState(params.get('appointmentId') || '')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState(null)

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const [a, p] = await Promise.all([
        axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_DOCTOR(user.userId)),
        axiosInstance.get(ENDPOINTS.PRESCRIPTIONS_BY_DOCTOR(user.userId)),
      ])
      setAppointments(a.data)
      setPrescriptions(p.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load your appointments.'))
    }
  }

  // Appointments that can still get a prescription (none issued yet): any of today's visits, plus
  // earlier visits that actually took place. Old bookings that were never attended are left out.
  const today = todayLocal()
  const pending = useMemo(
    () =>
      appointments
        .filter(
          a =>
            !a.hasPrescription &&
            a.appointmentDate &&
            ((a.appointmentDate === today && OPEN.includes(a.status)) ||
              (a.appointmentDate < today && PAST_VISIT.includes(a.status))),
        )
        .sort((x, y) => (y.startTime || '').localeCompare(x.startTime || '')),
    [appointments, today],
  )
  const selected = pending.find(a => String(a.appointmentId) === String(selectedId))

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!selected) {
      setFieldErrors({ appointmentId: 'Choose the appointment first.' })
      return
    }
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      await axiosInstance.post(ENDPOINTS.PRESCRIPTIONS, {
        appointmentId: selected.appointmentId,
        diagnosisNotes: form.diagnosisNotes,
        medicationList: form.medicationList,
        advice: form.advice,
        followUpDate: form.followUpDate || null,
      })
      toast.success(`Prescription issued for ${selected.patientName}. The visit is completed and their record updated.`)
      setForm(EMPTY)
      setSelectedId('')
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not issue the prescription.'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  const tomorrow = toLocalDateString(new Date(Date.now() + 86400000))

  return (
    <PageLayout>
      <PageTitle title="Prescriptions" subtitle="Issue prescriptions for your own appointments" />

      <Card as="form" title="New prescription" className="max-w-lg mb-6" onSubmit={submit}>
        <Alert tone="error">{error}</Alert>
        <Select
          id="rx-appt"
          label="Appointment"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          placeholder={pending.length ? 'Choose an appointment…' : 'No appointments waiting for a prescription'}
          options={pending.map(a => ({
            value: a.appointmentId,
            label: `${a.appointmentDate === today ? 'Today' : formatDate(a.appointmentDate)} ${formatTime(a.startTime)} — ${a.patientName}${a.reasonForVisit ? ` (${a.reasonForVisit})` : ''} · ${a.status.replace('_', ' ').toLowerCase()}`,
          }))}
          error={fieldErrors.appointmentId}
        />
        {selected && (
          <div className="picked mb-4">
            <span>
              <strong>{selected.patientName}</strong> <StatusBadge status={selected.status} />
            </span>
            <Button variant="outline" size="sm" onClick={() => setHistory(selected)}>
              View history
            </Button>
          </div>
        )}
        <Textarea
          id="rx-diag"
          label="Diagnosis"
          rows={2}
          required
          value={form.diagnosisNotes}
          onChange={set('diagnosisNotes')}
          error={fieldErrors.diagnosisNotes}
        />
        <Textarea
          id="rx-meds"
          label="Medications"
          required
          placeholder="e.g. Paracetamol 500mg twice daily for 3 days"
          value={form.medicationList}
          onChange={set('medicationList')}
          error={fieldErrors.medicationList}
        />
        <Textarea id="rx-advice" label="Advice (optional)" rows={2} value={form.advice} onChange={set('advice')} />
        <Input
          id="rx-follow"
          label="Follow-up date (optional)"
          type="date"
          min={tomorrow}
          fieldClassName="max-w-sm"
          hint="A visit with you within 7 days after this date is billed at the follow-up rate."
          value={form.followUpDate}
          onChange={set('followUpDate')}
          error={fieldErrors.followUpDate}
        />
        <Button type="submit" loading={saving} disabled={!selected}>
          Issue prescription
        </Button>
      </Card>

      <Card title="Issued prescriptions" className="max-w-lg">
        {prescriptions.length === 0 ? (
          <EmptyState icon="💊" title="None yet" />
        ) : (
          <div className="divider-list">
            {prescriptions.map(p => (
              <div key={p.prescriptionId}>
                <div className="row-between">
                  <strong>{p.patientName}</strong>
                  <span className="muted text-xs">
                    {formatDate(p.appointmentDate || p.issuedAt)} · #{p.appointmentId}
                  </span>
                </div>
                <p className="text-sm">
                  <strong>Diagnosis:</strong> {p.diagnosisNotes}
                </p>
                <p className="text-sm">
                  <strong>Medications:</strong> {p.medicationList}
                </p>
                {p.advice && (
                  <p className="text-sm">
                    <strong>Advice:</strong> {p.advice}
                  </p>
                )}
                {p.followUpDate && <p className="muted text-xs">Follow-up: {formatDate(p.followUpDate)}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {history && (
        <PatientHistoryDialog
          patientId={history.patientId}
          patientName={history.patientName}
          onClose={() => setHistory(null)}
        />
      )}
    </PageLayout>
  )
}
