import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import StatusBadge from '../../components/common/StatusBadge'
import axiosInstance from '../../api/axiosInstance'
import { formatDate } from '../../utils/formatters'

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: '2.4rem', fontWeight: 700, color: color || 'var(--color-dark)', margin: 0 }}>{value ?? 0}</p>
    </div>
  )
}

export default function ReceptionistDashboard() {
  const [stats, setStats]       = useState(null)
  const [today, setToday]       = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const [statsRes, todayRes] = await Promise.all([
        axiosInstance.get('/appointments/stats'),
        axiosInstance.get(`/appointments/all?date=${todayStr}`)
      ])
      setStats(statsRes.data)
      setToday(todayRes.data)
    } catch { setStats(null) }
    finally { setLoading(false) }
  }

  async function handleStatus(id, status) {
    try {
      await axiosInstance.patch(`/appointments/${id}/status`, { status })
      fetchAll()
    } catch {}
  }

  const statusOptions = ['BOOKED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW']

  return (
    <PageLayout>
      <PageTitle title="Receptionist Dashboard" subtitle="Front desk overview" />

      {loading ? <Spinner /> : (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <StatCard label="Today's Appointments" value={stats?.todayTotal} color="var(--color-dark)" />
            <StatCard label="Booked" value={stats?.todayBooked} color="var(--color-accent)" />
            <StatCard label="Completed" value={stats?.todayCompleted} color="#27ae60" />
            <StatCard label="Cancelled" value={stats?.todayCancelled} color="#e74c3c" />
            <StatCard label="Total All Time" value={stats?.totalAll} color="#7f8c8d" />
          </div>

          {/* Today's appointments table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
              <h3 style={{ margin: 0 }}>Today's Appointments</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {today.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No appointments today</td></tr>
                  )}
                  {today.map(a => (
                    <tr key={a.appointmentId}>
                      <td style={{ fontSize: 12 }}>{a.appointmentId}</td>
                      <td><strong>{a.patientName}</strong></td>
                      <td>{a.doctorName}</td>
                      <td style={{ fontSize: 12 }}>
                        {a.startTime ? new Date(a.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>{a.reasonForVisit || '—'}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <select
                          value={a.status}
                          onChange={e => handleStatus(a.appointmentId, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd',
                            fontSize: 12, cursor: 'pointer' }}>
                          {statusOptions.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  )
}
