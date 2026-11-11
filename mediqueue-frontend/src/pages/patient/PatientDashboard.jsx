import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { ErrorState, LoadingState, StatCard } from '../../components/ui'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    axiosInstance
      .get(`/patient/dashboard/${user.userId}`)
      .then(res => setStats(res.data))
      .catch(err => setError(errorMessage(err, 'Unable to load dashboard statistics.')))
  }
  useEffect(load, [user.userId])

  return (
    <PageLayout>
      <PageTitle title={`Welcome, ${user?.name || user?.username}`} subtitle="Here's your health at a glance" />
      <ErrorState message={error} onRetry={load} />
      {!stats && !error && <LoadingState />}
      {stats && (
        <div className="grid-auto mb-6">
          <StatCard
            label="Upcoming Appointments"
            value={stats.upcomingAppointments}
            tone="accent"
            to="/patient/appointments"
          />
          <StatCard label="Pending Bills" value={stats.pendingBills} to="/patient/billing" />
          <StatCard label="Lab Reports Ready" value={stats.reportsReady} to="/patient/reports" />
          <StatCard label="Open Complaints" value={stats.openComplaints} to="/patient/complaints" />
        </div>
      )}
      <Link to="/patient/book" className="btn btn-primary">
        + Book an appointment
      </Link>
    </PageLayout>
  )
}
