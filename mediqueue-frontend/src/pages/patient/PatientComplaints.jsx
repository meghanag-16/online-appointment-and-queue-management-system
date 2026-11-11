import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { raiseComplaint, getMyComplaints } from '../../api/complaintApi'
import { useAuth } from '../../context/AuthContext'
import { drName, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

const ISSUE_TYPES = ['Doctor delay', 'Billing', 'Lab report', 'Staff behaviour', 'Facilities', 'Other']
const STEPS = ['OPEN', 'UNDER_REVIEW', 'RESOLVED']

/** Raise a complaint (optionally about one of your appointments or bills) and follow its progress. */
export default function PatientComplaints() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [bills, setBills] = useState([])
  const [complaints, setComplaints] = useState([])
  const [form, setForm] = useState({ issueType: '', description: '', appointmentId: '', billId: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadComplaints = () => getMyComplaints().then(r => setComplaints(r.data)).catch(() => setComplaints([]))

  useEffect(() => {
    loadComplaints()
    axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_PATIENT(user.userId)).then(r => setAppointments(r.data || [])).catch(() => {})
    axiosInstance.get(ENDPOINTS.BILL_BY_PATIENT(user.userId)).then(r => setBills(r.data || [])).catch(() => {})
  }, [user.userId])

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setMessage(''); setError(''); setBusy(true)
    try {
      const res = await raiseComplaint(form)
      setMessage(`Complaint ${res.data.complaintId} submitted. You'll be notified as it is reviewed.`)
      setForm({ issueType: '', description: '', appointmentId: '', billId: '' })
      loadComplaints()
    } catch (err) {
      setError(errorMessage(err, 'Could not submit the complaint.'))
    } finally { setBusy(false) }
  }

  return (
    <PageLayout>
      <PageTitle title="Complaints" subtitle="Tell us about a problem and follow it until it is resolved" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Raise a complaint</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="cmp-type">Issue type</label>
              <select id="cmp-type" className="form-control" value={form.issueType} onChange={set('issueType')} required>
                <option value="">Select issue type</option>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cmp-appt">About an appointment (optional)</label>
              <select id="cmp-appt" className="form-control" value={form.appointmentId} onChange={set('appointmentId')}>
                <option value="">None</option>
                {appointments.map(a => (
                  <option key={a.appointmentId} value={a.appointmentId}>
                    #{a.appointmentId} · {drName(a.doctorName)} · {formatDateTime(a.startTime || a.appointmentDate)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cmp-bill">About a bill (optional)</label>
              <select id="cmp-bill" className="form-control" value={form.billId} onChange={set('billId')}>
                <option value="">None</option>
                {bills.map(b => (
                  <option key={b.billId} value={b.billId}>
                    Bill #{b.billId} · {formatCurrency(b.totalAmount)} · appointment #{b.appointmentId}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cmp-desc">Description</label>
              <textarea id="cmp-desc" className="form-control" rows={5} maxLength={4000} required
                placeholder="What happened?" value={form.description} onChange={set('description')} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit complaint'}</button>
          </form>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>My complaints</h3>
          {complaints.length === 0 && <div className="card"><p style={{ color: 'var(--color-text-muted)', margin: 0 }}>You haven't raised any complaints.</p></div>}
          {complaints.map(c => (
            <div key={c.complaintId} className="card" style={{ marginBottom: 12 }} data-testid={`my-complaint-${c.complaintId}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong>{c.complaintId} · {c.issueType}</strong>
                <StatusBadge status={c.status} />
              </div>
              <Progress status={c.status} />
              <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>{c.description}</p>
              <small style={{ color: 'var(--color-text-muted)' }}>
                Raised {formatDate(c.createdOn)}
                {c.appointmentId ? ` · appointment #${c.appointmentId}` : ''}{c.billId ? ` · bill #${c.billId}` : ''}
              </small>
              {c.resolution && (
                <div className="alert alert-info" style={{ marginTop: 10, marginBottom: 0 }}>
                  <strong>Hospital's response:</strong> {c.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}

function Progress({ status }) {
  const reached = STEPS.indexOf(status)
  return (
    <div style={{ display: 'flex', gap: 4 }} aria-label={`Progress: ${status}`}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= reached ? 'var(--color-accent)' : 'var(--color-border)' }} />
      ))}
    </div>
  )
}
