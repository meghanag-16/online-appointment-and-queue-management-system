import { useRef, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import ReportsTable from '../../components/lab/ReportsTable'
import { searchLabAppointments, uploadLabReport, getLabReportsByAppointment, checkLabFile } from '../../api/labApi'
import { errorMessage } from '../../api/axiosInstance'
import { drName, formatDateTime } from '../../utils/formatters'

const COMMON_TESTS = ['Blood test', 'Urine test', 'Lipid profile', 'Blood sugar', 'Thyroid profile', 'X-ray', 'ECG', 'Ultrasound', 'MRI', 'CT scan']

/** Find the appointment (by appointment ID, patient ID or name), then upload a PDF or image report to it. */
export default function LabDashboard() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [reports, setReports] = useState([])

  const [reportType, setReportType] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState(null)
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) { setError('Enter an appointment ID, a patient ID or a patient name.'); return }
    setSearching(true); setError(''); setMessage('')
    try {
      const res = await searchLabAppointments(query.trim())
      setResults(res.data)
      if (res.data.length === 1) choose(res.data[0])
    } catch (err) {
      setResults([]); setError(errorMessage(err, 'Search failed.'))
    } finally { setSearching(false) }
  }

  async function loadReports(appointmentId) {
    try { setReports((await getLabReportsByAppointment(appointmentId)).data) } catch { setReports([]) }
  }

  function choose(a) {
    setSelected(a); setMessage(''); setError('')
    loadReports(a.appointmentId)
  }

  function pickFile(f) {
    setFile(f || null)
    setError(f ? checkLabFile(f) : '')
  }

  async function upload(e) {
    e.preventDefault()
    setMessage('')
    if (!reportType.trim()) { setError('Enter the test name.'); return }
    const problem = checkLabFile(file)
    if (problem) { setError(problem); return }
    const fd = new FormData()
    fd.append('appointmentId', selected.appointmentId)
    fd.append('reportType', reportType.trim())
    if (remarks.trim()) fd.append('remarks', remarks.trim())
    fd.append('file', file)
    setBusy(true); setError('')
    try {
      await uploadLabReport(fd)
      setMessage(`${reportType.trim()} uploaded for ${selected.patientName}. They have been notified.`)
      setReportType(''); setRemarks(''); setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      loadReports(selected.appointmentId)
      setResults(rs => rs?.map(r => r.appointmentId === selected.appointmentId ? { ...r, reportCount: r.reportCount + 1 } : r))
    } catch (err) {
      setError(errorMessage(err, 'Upload failed.'))
    } finally { setBusy(false) }
  }

  return (
    <PageLayout>
      <PageTitle title="Upload Lab Reports" subtitle="Find the appointment, then attach the report (PDF, PNG or JPEG, up to 10 MB)" />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label htmlFor="lab-search" className="sr-only">Search</label>
          <input id="lab-search" className="form-control" style={{ flex: 1, minWidth: 240 }}
            placeholder="Appointment ID, patient ID or patient name" value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
        </form>

        {results && (
          <div className="table-wrapper" style={{ marginTop: 16 }}>
            <table>
              <thead><tr><th>Appointment</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th><th>Reports</th><th></th></tr></thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)' }}>No matching appointments</td></tr>
                )}
                {results.map(a => (
                  <tr key={a.appointmentId} data-testid={`lab-appt-${a.appointmentId}`}
                    style={selected?.appointmentId === a.appointmentId ? { background: 'var(--color-accent-soft)' } : undefined}>
                    <td>#{a.appointmentId}</td>
                    <td>{a.patientName}<br /><small style={{ color: 'var(--color-text-muted)' }}>{a.patientId}</small></td>
                    <td>{drName(a.doctorName)}{a.departmentName ? <><br /><small style={{ color: 'var(--color-text-muted)' }}>{a.departmentName}</small></> : null}</td>
                    <td>{formatDateTime(a.startTime || a.appointmentDate)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{a.reportCount}</td>
                    <td>
                      {a.canUpload
                        ? <button type="button" className="btn btn-outline btn-sm" onClick={() => choose(a)}>Select</button>
                        : <small style={{ color: 'var(--color-text-muted)' }}>Not possible</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Upload for appointment #{selected.appointmentId}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              {selected.patientName} · {drName(selected.doctorName)}
            </p>
            <form onSubmit={upload}>
              <div className="form-group">
                <label htmlFor="lab-test">Test name</label>
                <input id="lab-test" className="form-control" list="lab-tests" placeholder="e.g. Blood test"
                  value={reportType} onChange={e => setReportType(e.target.value)} maxLength={100} required />
                <datalist id="lab-tests">{COMMON_TESTS.map(t => <option key={t} value={t} />)}</datalist>
              </div>
              <div className="form-group">
                <label htmlFor="lab-file">Report file</label>
                <input id="lab-file" ref={fileInput} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={e => pickFile(e.target.files?.[0])} />
                <small style={{ color: 'var(--color-text-muted)' }}>PDF, PNG or JPEG, up to 10 MB</small>
              </div>
              <div className="form-group">
                <label htmlFor="lab-remarks">Remarks (optional)</label>
                <textarea id="lab-remarks" className="form-control" rows={3} maxLength={2000}
                  value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Fasting sample" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload report'}</button>
            </form>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <h3 style={{ padding: '16px 20px 0' }}>Reports on this appointment</h3>
            <ReportsTable reports={reports} emptyText="Nothing uploaded for this appointment yet." />
          </div>
        </div>
      )}
    </PageLayout>
  )
}
