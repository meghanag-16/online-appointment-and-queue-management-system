import { useState } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { downloadLabReport, formatFileSize } from '../../utils/download'
import { drName, formatDate, formatDateTime } from '../../utils/formatters'
import { Alert, Button, Cell, Table } from '../ui'

/** Lab reports with a Download button. showPatient adds the patient column (staff views). */
export default function ReportsTable({ reports, showPatient = false, emptyText = 'No reports yet.' }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  async function download(r) {
    setError('')
    setBusy(r.reportId)
    try {
      await downloadLabReport(r)
    } catch (err) {
      setError(errorMessage(err, 'Could not download the report.'))
    } finally {
      setBusy(null)
    }
  }

  const headers = [
    'Test',
    'Appointment',
    ...(showPatient ? ['Patient'] : []),
    'Doctor',
    'File',
    'Uploaded',
    'Remarks',
    '',
  ]

  return (
    <>
      <Alert tone="error">{error}</Alert>
      <Table headers={headers} empty={emptyText} isEmpty={reports.length === 0}>
        {reports.map(r => (
          <tr key={r.reportId} data-testid={`report-row-${r.reportId}`}>
            <td>
              <strong>{r.reportType}</strong>
            </td>
            <td>
              <Cell main={`#${r.appointmentId}`} sub={formatDate(r.appointmentDate)} />
            </td>
            {showPatient && (
              <td>
                <Cell main={r.patientName} sub={r.patientId} />
              </td>
            )}
            <td>{drName(r.doctorName)}</td>
            <td className="text-sm">
              <Cell main={r.fileName} sub={formatFileSize(r.fileSize)} />
            </td>
            <td>{formatDateTime(r.uploadTime)}</td>
            <td className="text-sm">{r.remarks || '—'}</td>
            <td>
              <Button
                size="sm"
                loading={busy === r.reportId}
                onClick={() => download(r)}
                data-testid={`download-${r.reportId}`}
              >
                Download
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  )
}
