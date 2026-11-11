import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import { getAllComplaints, updateComplaintStatus } from '../../api/complaintApi'
import { errorMessage } from '../../api/axiosInstance'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { Alert, Button, Card, EmptyState, ErrorState, LoadingState, Textarea, useToast } from '../../components/ui'

const FILTERS = [
  ['', 'All'],
  ['OPEN', 'Open'],
  ['UNDER_REVIEW', 'Under review'],
  ['RESOLVED', 'Resolved'],
]

/** Open → Under review → Resolved. The resolution note is saved and shown to the patient. */
export default function AdminComplaints() {
  const toast = useToast()
  const [filter, setFilter] = useState('OPEN')
  const [complaints, setComplaints] = useState(null)
  const [notes, setNotes] = useState({})
  const [noteErrors, setNoteErrors] = useState({})
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      setComplaints((await getAllComplaints(filter)).data)
      setLoadError('')
    } catch (err) {
      setComplaints([])
      setLoadError(errorMessage(err, 'Could not load complaints.'))
    }
  }
  useEffect(() => {
    load()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function move(c, status) {
    setError('')
    const note = (notes[c.complaintId] || '').trim()
    if (status === 'RESOLVED' && !note) {
      setNoteErrors(e => ({ ...e, [c.complaintId]: 'Write a resolution note first: the patient will see it.' }))
      return
    }
    setNoteErrors(e => ({ ...e, [c.complaintId]: '' }))
    try {
      await updateComplaintStatus(c.complaintId, status, note || undefined)
      toast.success(
        status === 'RESOLVED'
          ? `${c.complaintId} resolved; ${c.patientName} has been notified.`
          : `${c.complaintId} is now under review.`,
      )
      setNotes(n => ({ ...n, [c.complaintId]: '' }))
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the complaint.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Complaints" subtitle="Review patient complaints and record how each was resolved" />
      <ErrorState message={loadError} onRetry={load} />
      <Alert tone="error">{error}</Alert>
      <div className="row mb-4" role="group" aria-label="Filter by status">
        {FILTERS.map(([v, label]) => (
          <Button key={label} size="sm" variant={filter === v ? 'primary' : 'outline'} onClick={() => setFilter(v)}>
            {label}
          </Button>
        ))}
      </div>
      {complaints === null ? (
        <LoadingState label="Loading complaints…" />
      ) : (
        <div className="stack max-w-lg">
          {complaints.length === 0 && (
            <Card>
              <EmptyState icon="✅" title="No complaints here" />
            </Card>
          )}
          {complaints.map(c => (
            <Card key={c.complaintId} data-testid={`complaint-${c.complaintId}`}>
              <div className="row-between">
                <div>
                  <strong>
                    {c.complaintId} · {c.issueType}
                  </strong>
                  <p className="muted text-sm">
                    {c.patientName} ({c.patientId}) · raised {formatDate(c.createdOn)}
                    {c.appointmentId ? ` · appointment #${c.appointmentId}` : ''}
                    {c.billId ? ` · bill #${c.billId}` : ''}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-2 mb-4 pre-line">{c.description}</p>
              {c.resolution && (
                <Alert tone="info">
                  <strong>Note:</strong> {c.resolution}
                  {c.resolvedAt && <span className="block text-xs">Resolved {formatDateTime(c.resolvedAt)}</span>}
                </Alert>
              )}
              {c.status !== 'RESOLVED' && (
                <div className="row row-top">
                  <Textarea
                    id={`note-${c.complaintId}`}
                    label={c.status === 'OPEN' ? 'Note (optional)' : 'Resolution note'}
                    required={c.status === 'UNDER_REVIEW'}
                    rows={2}
                    fieldClassName="grow"
                    maxLength={4000}
                    placeholder={
                      c.status === 'OPEN' ? 'What you are checking' : 'How it was resolved (shown to the patient)'
                    }
                    value={notes[c.complaintId] || ''}
                    error={noteErrors[c.complaintId]}
                    onChange={e => setNotes(n => ({ ...n, [c.complaintId]: e.target.value }))}
                  />
                  {c.status === 'OPEN' && (
                    <Button variant="outline" className="mt-6" onClick={() => move(c, 'UNDER_REVIEW')}>
                      Start review
                    </Button>
                  )}
                  {c.status === 'UNDER_REVIEW' && (
                    <Button className="mt-6" onClick={() => move(c, 'RESOLVED')}>
                      Resolve
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
