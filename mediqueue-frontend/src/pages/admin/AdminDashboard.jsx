import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import axiosInstance from '../../api/axiosInstance'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalDoctors: 0, activeAppointments: 0, openComplaints: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/admin/dashboard')
        setStats({
          totalUsers: res.data?.totalUsers || 0,
          totalDoctors: res.data?.totalDoctors || 0,
          activeAppointments: res.data?.activeAppointments || 0,
          openComplaints: res.data?.openComplaints || 0
        })
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const data = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Total Doctors', value: stats.totalDoctors },
    { label: 'Active Appointments', value: stats.activeAppointments },
    { label: 'Open Complaints', value: stats.openComplaints }
  ]

  return (
    <PageLayout>
      <PageTitle title="Admin Dashboard" subtitle="System overview and management" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:20 }}>
        {data.map(item=>(
          <div key={item.label} className="card">
            <p style={{fontSize:'0.8rem',color:'var(--color-text-muted)',marginBottom:8}}>{item.label}</p>
            <p style={{fontSize:'2rem',fontWeight:700,color:'var(--color-dark)'}}>{loading ? '—' : item.value}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
