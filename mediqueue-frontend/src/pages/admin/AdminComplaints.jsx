import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import { getAllComplaints, updateComplaintStatus } from '../../api/complaintApi'
import { errorMessage } from '../../api/axiosInstance'
import { formatDate, formatDateTime } from '../../utils/formatters'

const FILTERS = [['', 'All'], ['OPEN', 'Open'], ['UNDER_REVIEW', 'Under review'], ['RESOLVED', 'Resolved']]

/** Open → Under review → Resolved. The resolution note is saved and shown to the patient. */
export default function AdminComplaints() {
  const [filter, setFilter] = useState('OPEN')
  const [complaints, setComplaints] = useState(null)
  const [notes, setNotes] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try { setComplaints((await getAllComplaints(filter)).data) }
    catch (err) { setComplaints([]); setError(errorMessage(err, 'Could not load complaints.')) }
  }
  useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function move(c, status) {
    setMessage(''); setError('')
    const note = (notes[c.complaintId] || '').trim()
    if (status === 'RESOLVED' && !note) { setError('Write a resolution note first: the patient will see it.'); return }
    try {
      await updateComplaintStatus(c.complaintId, status, note || undefined)
      setMessage(status === 'RESOLVED' ? `${c.complaintId} resolved; ${c.patientName} has been notified.` : `${c.complaintId} is now under review.`)
      setNotes(n => ({ ...n, [c.complaintId]: '' }))
      load()
    } catch (err) { setError(errorMessage(err, 'Could not update the complaint.')) }
  }

  return (
    <PageLayout>
      <PageTitle title="Complaints" subtitle="Review patient complaints and record how each was resolved" />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map(([v, label]) => (
          <button key={label} type="button" className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(v)}>{label}</button>
        ))}
      </div>
      {complaints === null ? <Spinner /> : (
        <div style={{ maxWidth: 900 }}>
          {complaints.length === 0 && <div className="card"><p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No complaints here.</p></div>}
          {complaints.map(c => (
            <div key={c.complaintId} className="card" style={{ marginBottom: 14 }} data-testid={`complaint-${c.complaintId}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <strong>{c.complaintId} · {c.issueType}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {c.patientName} ({c.patientId}) · raised {formatDate(c.createdOn)}
                    {c.appointmentId ? ` · appointment #${c.appointmentId}` : ''}{c.billId ? ` · bill #${c.billId}` : ''}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p style={{ margin: '10px 0' }}>{c.description}</p>
              {c.resolution && (
                <div className="alert alert-info" style={{ marginBottom: 10 }}>
                  <strong>Note:</strong> {c.resolution}
                  {c.resolvedAt && <small style={{ display: 'block', color: 'var(--color-text-muted)' }}>Resolved {formatDateTime(c.resolvedAt)}</small>}
                </div>
              )}
              {c.status !== 'RESOLVED' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <label htmlFor={`note-${c.complaintId}`} className="sr-only">Note</label>
                  <textarea id={`note-${c.complaintId}`} className="form-control" rows={2} style={{ flex: 1, minWidth: 260 }}
                    placeholder={c.status === 'OPEN' ? 'Optional note while you look into it' : 'Resolution note (required, shown to the patient)'}
                    value={notes[c.complaintId] || ''} onChange={e => setNotes(n => ({ ...n, [c.complaintId]: e.target.value }))} />
                  {c.status === 'OPEN' && <button type="button" className="btn btn-outline" onClick={() => move(c, 'UNDER_REVIEW')}>Start review</button>}
                  {c.status === 'UNDER_REVIEW' && <button type="button" className="btn btn-primary" onClick={() => move(c, 'RESOLVED')}>Resolve</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
