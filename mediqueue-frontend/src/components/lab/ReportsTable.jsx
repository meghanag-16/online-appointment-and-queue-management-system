import { useState } from 'react'
import { errorMessage } from '../../api/axiosInstance'
import { downloadLabReport, formatFileSize } from '../../utils/download'
import { drName, formatDate, formatDateTime } from '../../utils/formatters'

/** Lab reports with a Download button. showPatient adds patient and doctor columns (staff views). */
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

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Test</th>
              <th>Appointment</th>
              {showPatient && <th>Patient</th>}
              <th>Doctor</th>
              <th>File</th>
              <th>Uploaded</th>
              <th>Remarks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td
                  colSpan={showPatient ? 8 : 7}
                  style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {reports.map(r => (
              <tr key={r.reportId} data-testid={`report-row-${r.reportId}`}>
                <td>
                  <strong>{r.reportType}</strong>
                </td>
                <td>
                  #{r.appointmentId}
                  <br />
                  <small style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.appointmentDate)}</small>
                </td>
                {showPatient && (
                  <td>
                    {r.patientName}
                    <br />
                    <small style={{ color: 'var(--color-text-muted)' }}>{r.patientId}</small>
                  </td>
                )}
                <td>{drName(r.doctorName)}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {r.fileName}
                  <br />
                  <small style={{ color: 'var(--color-text-muted)' }}>{formatFileSize(r.fileSize)}</small>
                </td>
                <td>{formatDateTime(r.uploadTime)}</td>
                <td style={{ maxWidth: 220, fontSize: '0.85rem' }}>{r.remarks || '—'}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy === r.reportId}
                    onClick={() => download(r)}
                  >
                    {busy === r.reportId ? '…' : 'Download'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
