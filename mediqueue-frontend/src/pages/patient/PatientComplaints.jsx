import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { raiseComplaint, getMyComplaints } from '../../api/complaintApi'
import { useAuth } from '../../context/AuthContext'
import { drName, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'
import { Alert, Button, Card, EmptyState, LoadingState, Select, Textarea, useToast } from '../../components/ui'

const ISSUE_TYPES = ['Doctor delay', 'Billing', 'Lab report', 'Staff behaviour', 'Facilities', 'Other']
const STEPS = ['OPEN', 'UNDER_REVIEW', 'RESOLVED']
const EMPTY = { issueType: '', description: '', appointmentId: '', billId: '' }

/** Raise a complaint (optionally about one of your appointments or bills) and follow its progress. */
export default function PatientComplaints() {
  const { user } = useAuth()
  const toast = useToast()
  const [appointments, setAppointments] = useState([])
  const [bills, setBills] = useState([])
  const [complaints, setComplaints] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const loadComplaints = () =>
    getMyComplaints()
      .then(r => setComplaints(r.data))
      .catch(() => setComplaints([]))

  useEffect(() => {
    loadComplaints()
    axiosInstance
      .get(ENDPOINTS.APPOINTMENTS_BY_PATIENT(user.userId))
      .then(r => setAppointments(r.data || []))
      .catch(() => {})
    axiosInstance
      .get(ENDPOINTS.BILL_BY_PATIENT(user.userId))
      .then(r => setBills(r.data || []))
      .catch(() => {})
  }, [user.userId])

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (form.description.trim().length < 10) {
      setFieldErrors({ description: 'Please describe the problem in a sentence or two.' })
      return
    }
    setBusy(true)
    try {
      const res = await raiseComplaint(form)
      toast.success(`Complaint ${res.data.complaintId} submitted. You'll be notified as it is reviewed.`)
      setForm(EMPTY)
      loadComplaints()
    } catch (err) {
      setError(errorMessage(err, 'Could not submit the complaint.'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Complaints" subtitle="Tell us about a problem and follow it until it is resolved" />
      <div className="grid-2">
        <Card title="Raise a complaint" as="form" onSubmit={submit}>
          <Alert tone="error">{error}</Alert>
          <Select
            id="cmp-type"
            label="Issue type"
            value={form.issueType}
            onChange={set('issueType')}
            required
            placeholder="Select issue type"
            options={ISSUE_TYPES}
          />
          <Select
            id="cmp-appt"
            label="About an appointment (optional)"
            value={form.appointmentId}
            onChange={set('appointmentId')}
            placeholder="None"
            options={appointments.map(a => ({
              value: a.appointmentId,
              label: `#${a.appointmentId} · ${drName(a.doctorName)} · ${formatDateTime(a.startTime || a.appointmentDate)}`,
            }))}
          />
          <Select
            id="cmp-bill"
            label="About a bill (optional)"
            value={form.billId}
            onChange={set('billId')}
            placeholder="None"
            options={bills.map(b => ({
              value: b.billId,
              label: `Bill #${b.billId} · ${formatCurrency(b.totalAmount)} · appointment #${b.appointmentId}`,
            }))}
          />
          <Textarea
            id="cmp-desc"
            label="Description"
            rows={5}
            maxLength={4000}
            required
            placeholder="What happened?"
            hint={`${form.description.length}/4000`}
            value={form.description}
            onChange={set('description')}
            error={fieldErrors.description}
          />
          <Button type="submit" loading={busy}>
            Submit complaint
          </Button>
        </Card>

        <div className="stack">
          <h3>My complaints</h3>
          {complaints === null && <LoadingState />}
          {complaints?.length === 0 && (
            <Card>
              <EmptyState icon="💬" title="No complaints yet" description="You haven't raised any complaints." />
            </Card>
          )}
          {complaints?.map(c => (
            <Card key={c.complaintId} data-testid={`my-complaint-${c.complaintId}`}>
              <div className="row-between mb-2">
                <strong>
                  {c.complaintId} · {c.issueType}
                </strong>
                <StatusBadge status={c.status} />
              </div>
              <Progress status={c.status} />
              <p className="mt-2 mb-2 pre-line">{c.description}</p>
              <small className="muted">
                Raised {formatDate(c.createdOn)}
                {c.appointmentId ? ` · appointment #${c.appointmentId}` : ''}
                {c.billId ? ` · bill #${c.billId}` : ''}
              </small>
              {c.resolution && (
                <Alert tone="info" className="mt-2 mb-0">
                  <strong>Hospital&apos;s response:</strong> {c.resolution}
                </Alert>
              )}
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}

function Progress({ status }) {
  const reached = STEPS.indexOf(status)
  return (
    <div className="progress" role="img" aria-label={`Progress: ${status}`}>
      {STEPS.map((s, i) => (
        <span key={s} className={i <= reached ? 'progress-step is-done' : 'progress-step'} />
      ))}
    </div>
  )
}
