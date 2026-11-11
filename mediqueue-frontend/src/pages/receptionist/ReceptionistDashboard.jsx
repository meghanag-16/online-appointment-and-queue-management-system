import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import StatusBadge from '../../components/common/StatusBadge'
import AppointmentStatusSelect from '../../components/booking/AppointmentStatusSelect'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { todayLocal, formatTime } from '../../utils/dates'

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: '2.4rem', fontWeight: 700, color: color || 'var(--color-dark)', margin: 0 }}>{value ?? 0}</p>
    </div>
  )
}

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState(null)
  const [today, setToday] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      // Local calendar day (not UTC), so early-morning IST shows today, not yesterday.
      const [statsRes, todayRes] = await Promise.all([
        axiosInstance.get(ENDPOINTS.APPOINTMENTS_STATS),
        axiosInstance.get(ENDPOINTS.APPOINTMENTS_ALL(todayLocal())),
      ])
      setStats(statsRes.data); setToday(todayRes.data); setError('')
    } catch (err) {
      setStats(null); setError(errorMessage(err, 'Could not load the dashboard.'))
    } finally { setLoading(false) }
  }

  async function handleStatus(a, status) {
    if (status === 'CANCELLED' && !window.confirm(`Cancel ${a.patientName}'s appointment?`)) return
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_STATUS(a.appointmentId), { status })
      fetchAll()
    } catch (err) { setError(errorMessage(err, 'Could not update the status.')) }
  }

  return (
    <PageLayout>
      <PageTitle title="Receptionist Dashboard" subtitle="Front desk overview" />
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <StatCard label="Today's Appointments" value={stats?.todayTotal} color="var(--color-dark)" />
            <StatCard label="Booked" value={stats?.todayBooked} color="var(--color-accent)" />
            <StatCard label="Completed" value={stats?.todayCompleted} color="#27ae60" />
            <StatCard label="Cancelled" value={stats?.todayCancelled} color="#e74c3c" />
            <StatCard label="Total All Time" value={stats?.totalAll} color="#7f8c8d" />
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0 }}>Today's Appointments</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Reason</th><th>Status</th><th>Update</th></tr>
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
                      <td style={{ fontSize: 12 }}>{formatTime(a.startTime)}</td>
                      <td style={{ fontSize: 12 }}>{a.reasonForVisit || '—'}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td><AppointmentStatusSelect appointment={a} onChange={handleStatus} /></td>
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
