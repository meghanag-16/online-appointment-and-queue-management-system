import { useRef, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import ReportsTable from '../../components/lab/ReportsTable'
import { searchLabAppointments, uploadLabReport, getLabReportsByAppointment, checkLabFile } from '../../api/labApi'
import { errorMessage } from '../../api/axiosInstance'
import { drName, formatDateTime } from '../../utils/formatters'
import { Alert, Button, Card, Cell, Field, Input, Table, Textarea, useToast } from '../../components/ui'

const COMMON_TESTS = [
  'Blood test',
  'Urine test',
  'Lipid profile',
  'Blood sugar',
  'Thyroid profile',
  'X-ray',
  'ECG',
  'Ultrasound',
  'MRI',
  'CT scan',
]

/** Find the appointment (by appointment ID, patient ID or name), then upload a PDF or image report to it. */
export default function LabDashboard() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState(null)
  const [reports, setReports] = useState([])

  const [reportType, setReportType] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState(null)
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) {
      setSearchError('Enter an appointment ID, a patient ID or a patient name.')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const res = await searchLabAppointments(query.trim())
      setResults(res.data)
      if (res.data.length === 1 && res.data[0].canUpload) choose(res.data[0])
    } catch (err) {
      setResults([])
      setSearchError(errorMessage(err, 'Search failed.'))
    } finally {
      setSearching(false)
    }
  }

  async function loadReports(appointmentId) {
    try {
      setReports((await getLabReportsByAppointment(appointmentId)).data)
    } catch {
      setReports([])
    }
  }

  function choose(a) {
    setSelected(a)
    setError('')
    setFieldErrors({})
    loadReports(a.appointmentId)
  }

  function pickFile(f) {
    setFile(f || null)
    setFieldErrors(e => ({ ...e, file: f ? checkLabFile(f) : '' }))
  }

  async function upload(e) {
    e.preventDefault()
    const problems = {
      reportType: reportType.trim() ? '' : 'Enter the test name.',
      file: checkLabFile(file),
    }
    setFieldErrors(problems)
    if (problems.reportType || problems.file) return
    const fd = new FormData()
    fd.append('appointmentId', selected.appointmentId)
    fd.append('reportType', reportType.trim())
    if (remarks.trim()) fd.append('remarks', remarks.trim())
    fd.append('file', file)
    setBusy(true)
    setError('')
    try {
      await uploadLabReport(fd)
      toast.success(`${reportType.trim()} uploaded for ${selected.patientName}. They have been notified.`)
      setReportType('')
      setRemarks('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      loadReports(selected.appointmentId)
      setResults(rs =>
        rs?.map(r => (r.appointmentId === selected.appointmentId ? { ...r, reportCount: r.reportCount + 1 } : r)),
      )
    } catch (err) {
      setError(errorMessage(err, 'Upload failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageLayout>
      <PageTitle
        title="Upload Lab Reports"
        subtitle="Find the appointment, then attach the report (PDF, PNG or JPEG, up to 10 MB)"
      />

      <Card className="mb-6">
        <form onSubmit={search} className="row row-top">
          <Input
            id="lab-search"
            label="Find appointment"
            fieldClassName="grow"
            placeholder="Appointment ID, patient ID or patient name"
            value={query}
            onChange={e => setQuery(e.target.value)}
            error={searchError}
            data-testid="lab-search"
          />
          <Button type="submit" loading={searching} className="mt-6">
            Search
          </Button>
        </form>

        {results && (
          <Table
            headers={['Appointment', 'Patient', 'Doctor', 'Time', 'Status', 'Reports', '']}
            empty="No matching appointments"
            isEmpty={results.length === 0}
          >
            {results.map(a => (
              <tr
                key={a.appointmentId}
                data-testid={`lab-appt-${a.appointmentId}`}
                className={selected?.appointmentId === a.appointmentId ? 'row-highlight' : undefined}
              >
                <td>#{a.appointmentId}</td>
                <td>
                  <Cell main={a.patientName} sub={a.patientId} />
                </td>
                <td>
                  <Cell main={drName(a.doctorName)} sub={a.departmentName} />
                </td>
                <td>{formatDateTime(a.startTime || a.appointmentDate)}</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td>{a.reportCount}</td>
                <td>
                  {a.canUpload ? (
                    <Button variant="outline" size="sm" onClick={() => choose(a)}>
                      Select
                    </Button>
                  ) : (
                    <small className="muted">Not possible</small>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {selected && (
        <div className="grid-2">
          <Card
            as="form"
            onSubmit={upload}
            title={`Upload for appointment #${selected.appointmentId}`}
            subtitle={`${selected.patientName} · ${drName(selected.doctorName)}`}
          >
            <Alert tone="error">{error}</Alert>
            <Input
              id="lab-test"
              label="Test name"
              list="lab-tests"
              placeholder="e.g. Blood test"
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              maxLength={100}
              required
              error={fieldErrors.reportType}
            />
            <datalist id="lab-tests">
              {COMMON_TESTS.map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <Field
              id="lab-file"
              label="Report file"
              required
              hint="PDF, PNG or JPEG, up to 10 MB"
              error={fieldErrors.file}
            >
              <input
                id="lab-file"
                ref={fileInput}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                aria-invalid={fieldErrors.file ? true : undefined}
                onChange={e => pickFile(e.target.files?.[0])}
                data-testid="lab-file"
              />
            </Field>
            <Textarea
              id="lab-remarks"
              label="Remarks (optional)"
              maxLength={2000}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Fasting sample"
            />
            <Button type="submit" loading={busy} data-testid="upload-btn">
              Upload report
            </Button>
          </Card>
          <Card flush title="Reports on this appointment">
            <ReportsTable reports={reports} emptyText="Nothing uploaded for this appointment yet." />
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
