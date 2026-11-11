import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import ReportsTable from '../../components/lab/ReportsTable'
import { getLabReportsByPatient } from '../../api/labApi'
import { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { Card, ErrorState, LoadingState } from '../../components/ui'

/** The patient's own lab reports, ready to download as soon as the lab uploads them. */
export default function PatientReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    getLabReportsByPatient(user.userId)
      .then(res => setReports(res.data))
      .catch(err => {
        setReports([])
        setError(errorMessage(err, 'Could not load your lab reports.'))
      })
  }
  useEffect(load, [user.userId])

  return (
    <PageLayout>
      <PageTitle title="Lab Reports" subtitle="Your test results. You get a notification when a new one is ready." />
      <ErrorState message={error} onRetry={load} />
      {reports === null ? (
        <LoadingState label="Loading reports…" />
      ) : (
        <Card flush>
          <ReportsTable reports={reports} emptyText="No lab reports yet." />
        </Card>
      )}
    </PageLayout>
  )
}
