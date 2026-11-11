import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { drName } from '../../utils/formatters'
import { ErrorState, LoadingState, StatCard } from '../../components/ui'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    axiosInstance
      .get(`/doctor/dashboard/${user.userId}`)
      .then(res => setStats(res.data))
      .catch(err => setError(errorMessage(err, 'Unable to load doctor dashboard data.')))
  }
  useEffect(load, [user.userId])

  return (
    <PageLayout>
      <PageTitle title={drName(user?.name || user?.username || '')} subtitle="Your schedule and patient overview" />
      <ErrorState message={error} onRetry={load} />
      {!stats && !error && <LoadingState />}
      {stats && (
        <div className="grid-auto mb-6">
          <StatCard
            label="Today's Appointments"
            value={stats.todaysAppointments}
            tone="accent"
            to="/doctor/appointments"
          />
          <StatCard label="In Queue" value={stats.inQueue} to="/doctor/queue" />
          <StatCard label="Pending Prescriptions" value={stats.pendingPrescriptions} to="/doctor/prescriptions" />
          <StatCard label="Completed Today" value={stats.completedToday} tone="success" />
        </div>
      )}
      <Link to="/doctor/queue" className="btn btn-primary">
        Open today&apos;s queue
      </Link>
    </PageLayout>
  )
}
