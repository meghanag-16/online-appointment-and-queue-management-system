import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import AppointmentStatusSelect from '../../components/booking/AppointmentStatusSelect'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { todayLocal, formatTime } from '../../utils/dates'
import {
  Alert,
  Button,
  Card,
  ErrorState,
  LoadingState,
  StatCard,
  Table,
  useConfirm,
  useToast,
} from '../../components/ui'

export default function ReceptionistDashboard() {
  const confirm = useConfirm()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [today, setToday] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      // Local calendar day (not UTC), so early-morning IST shows today, not yesterday.
      const [statsRes, todayRes] = await Promise.all([
        axiosInstance.get(ENDPOINTS.APPOINTMENTS_STATS),
        axiosInstance.get(ENDPOINTS.APPOINTMENTS_ALL(todayLocal())),
      ])
      setStats(statsRes.data)
      setToday(todayRes.data)
      setLoadError('')
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  async function togglePriority(a) {
    const next = a.priority === 'HIGH_PRIORITY' ? 'NORMAL' : 'HIGH_PRIORITY'
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.APPOINTMENT_PRIORITY(a.appointmentId), { priority: next })
      toast.success(`${a.patientName} is now ${next === 'HIGH_PRIORITY' ? 'high priority' : 'normal priority'}.`)
      fetchAll()
    } catch (err) {
      setError(errorMessage(err, 'Could not change the priority.'))
    }
  }

  async function handleStatus(a, status) {
    if (status === 'CANCELLED') {
      const ok = await confirm({
        title: `Cancel ${a.patientName}'s appointment?`,
        message: 'The slot is freed and the patient is notified.',
        confirmLabel: 'Cancel appointment',
        danger: true,
      })
      if (!ok) return
    }
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_STATUS(a.appointmentId), { status })
      fetchAll()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the status.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Receptionist Dashboard" subtitle="Front desk overview" />
      <ErrorState message={loadError} onRetry={fetchAll} />
      <Alert tone="error">{error}</Alert>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid-auto mb-6">
            <StatCard label="Today's Appointments" value={stats?.todayTotal} />
            <StatCard label="Booked" value={stats?.todayBooked} tone="accent" />
            <StatCard label="Completed" value={stats?.todayCompleted} tone="success" />
            <StatCard label="Cancelled" value={stats?.todayCancelled} tone="danger" />
            <StatCard label="Total All Time" value={stats?.totalAll} tone="muted" />
          </div>

          <Card flush title="Today's appointments">
            <Table
              headers={['ID', 'Patient', 'Doctor', 'Time', 'Reason', 'Priority', 'Status', 'Update']}
              empty="No appointments today"
              isEmpty={today.length === 0}
            >
              {today.map(a => (
                <tr key={a.appointmentId}>
                  <td className="text-xs">{a.appointmentId}</td>
                  <td>
                    <strong>{a.patientName}</strong>
                  </td>
                  <td>{a.doctorName}</td>
                  <td className="text-sm">{formatTime(a.startTime)}</td>
                  <td className="text-sm">{a.reasonForVisit || '—'}</td>
                  <td>
                    <StatusBadge status={a.priority || 'NORMAL'} />
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="nowrap">
                    <div className="row">
                      <AppointmentStatusSelect appointment={a} onChange={handleStatus} />
                      {['BOOKED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status) && (
                        <Button variant="outline" size="sm" onClick={() => togglePriority(a)}>
                          {a.priority === 'HIGH_PRIORITY' ? 'Unmark priority' : 'Mark high priority'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </PageLayout>
  )
}
