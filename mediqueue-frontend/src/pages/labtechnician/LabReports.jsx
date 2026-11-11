import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import ReportsTable from '../../components/lab/ReportsTable'
import { getAllLabReports } from '../../api/labApi'
import { errorMessage } from '../../api/axiosInstance'
import { Card, ErrorState, Input, LoadingState } from '../../components/ui'

/** Every uploaded report, newest first, with a filter and downloads. */
export default function LabReports() {
  const [reports, setReports] = useState(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  function load() {
    setError('')
    getAllLabReports()
      .then(res => setReports(res.data))
      .catch(err => {
        setReports([])
        setError(errorMessage(err, 'Could not load reports.'))
      })
  }
  useEffect(load, [])

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
      <ErrorState message={error} onRetry={load} />
      <Input
        id="lr-filter"
        label="Filter"
        fieldClassName="max-w-sm"
        placeholder="Patient, test, doctor or appointment #"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      {reports === null ? (
        <LoadingState label="Loading reports…" />
      ) : (
        <Card flush>
          <ReportsTable
            reports={shown}
            showPatient
            emptyText={reports.length ? 'No reports match the filter' : 'No reports yet'}
          />
        </Card>
      )}
    </PageLayout>
  )
}
