import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ upcomingAppointments: 0, pendingBills: 0, reportsReady: 0, openComplaints: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get(`/patient/dashboard/${user.userId}`)
        setStats(res.data)
      } catch (err) {
        setError('Unable to load dashboard statistics.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user?.userId])

  const cards = [
    { label: 'Upcoming Appointments', value: stats.upcomingAppointments, accent: true },
    { label: 'Pending Bills',          value: stats.pendingBills },
    { label: 'Lab Reports Ready',      value: stats.reportsReady },
    { label: 'Open Complaints',        value: stats.openComplaints },
  ]

  return (
    <PageLayout>
      <PageTitle title={`Welcome, ${user?.username}`} subtitle="Here's your health at a glance" />
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 20 }}>
          {cards.map(c => (
            <div key={c.label} className="card" style={{ borderTop: c.accent ? '3px solid var(--color-accent)' : undefined }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{c.label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: c.accent ? 'var(--color-accent)' : 'var(--color-dark)' }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
