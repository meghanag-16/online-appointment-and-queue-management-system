import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import ReportsTable from '../../components/lab/ReportsTable'
import { getLabReportsByPatient } from '../../api/labApi'
import { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

/** The patient's own lab reports, ready to download as soon as the lab uploads them. */
export default function PatientReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getLabReportsByPatient(user.userId)
      .then(res => setReports(res.data))
      .catch(err => {
        setReports([])
        setError(errorMessage(err, 'Could not load your lab reports.'))
      })
  }, [user.userId])

  return (
    <PageLayout>
      <PageTitle title="Lab Reports" subtitle="Your test results. You get a notification when a new one is ready." />
      {error && <div className="alert alert-error">{error}</div>}
      {reports === null ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <ReportsTable reports={reports} emptyText="No lab reports yet." />
        </div>
      )}
    </PageLayout>
  )
}
