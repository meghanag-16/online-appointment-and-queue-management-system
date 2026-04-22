import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ todaysAppointments: 0, inQueue: 0, pendingPrescriptions: 0, completedToday: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get(`/doctor/dashboard/${user.userId}`)
        setStats(res.data)
      } catch (err) {
        setError('Unable to load doctor dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user?.userId])

  const cards = [
    { label: "Today's Appointments", value: stats.todaysAppointments, accent: true },
    { label: 'In Queue', value: stats.inQueue },
    { label: 'Pending Prescriptions', value: stats.pendingPrescriptions },
    { label: 'Completed Today', value: stats.completedToday }
  ]

  return (
    <PageLayout>
      <PageTitle title={`Dr. ${user?.username}`} subtitle="Your schedule and patient overview" />
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <Spinner />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:20 }}>
          {cards.map(c=>(
            <div key={c.label} className="card" style={{borderTop:c.accent?'3px solid var(--color-accent)':undefined}}>
              <p style={{fontSize:'0.8rem',color:'var(--color-text-muted)',marginBottom:8}}>{c.label}</p>
              <p style={{fontSize:'2rem',fontWeight:700,color:c.accent?'var(--color-accent)':'var(--color-dark)'}}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
