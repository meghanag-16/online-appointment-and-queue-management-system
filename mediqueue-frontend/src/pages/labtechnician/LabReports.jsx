import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import ReportsTable from '../../components/lab/ReportsTable'
import { getAllLabReports } from '../../api/labApi'
import { errorMessage } from '../../api/axiosInstance'

/** Every uploaded report, newest first, with a filter and downloads. */
export default function LabReports() {
  const [reports, setReports] = useState(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getAllLabReports()
      .then(res => setReports(res.data))
      .catch(err => {
        setReports([])
        setError(errorMessage(err, 'Could not load reports.'))
      })
  }, [])

  const f = filter.trim().toLowerCase()
  const shown = (reports || []).filter(
    r =>
      !f ||
      String(r.appointmentId) === f.replace('#', '') ||
      [r.patientName, r.patientId, r.reportType, r.doctorName].some(v => v && v.toLowerCase().includes(f)),
  )

  return (
    <PageLayout>
      <PageTitle title="All Lab Reports" subtitle="Every report uploaded, newest first" />
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ marginBottom: 16, maxWidth: 420 }}>
        <label htmlFor="lr-filter" className="sr-only">
          Filter
        </label>
        <input
          id="lr-filter"
          className="form-control"
          placeholder="Filter by patient, test, doctor or appointment #"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      {reports === null ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <ReportsTable
            reports={shown}
            showPatient
            emptyText={reports.length ? 'No reports match the filter' : 'No reports yet'}
          />
        </div>
      )}
    </PageLayout>
  )
}
