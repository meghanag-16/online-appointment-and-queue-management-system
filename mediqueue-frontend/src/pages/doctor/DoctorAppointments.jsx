import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import AppointmentStatusSelect from '../../components/booking/AppointmentStatusSelect'
import PatientHistoryDialog from '../../components/clinical/PatientHistoryDialog'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatDate, formatEnum } from '../../utils/formatters'
import { formatTime } from '../../utils/dates'

/** The doctor's appointments, with In Progress / Completed / No Show actions where allowed. */
export default function DoctorAppointments() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState(null)

  useEffect(() => { load() }, [user.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const res = await axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_DOCTOR(user.userId))
      setData(res.data); setError('')
    } catch (err) { setError(errorMessage(err, 'Could not load appointments.')) }
  }

  async function changeStatus(a, status) {
    setMessage(''); setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_STATUS(a.appointmentId), { status })
      setMessage(`${a.patientName}: ${formatEnum(status)}.`)
      load()
    } catch (err) { setError(errorMessage(err, 'Could not update the status.')) }
  }

  return (
    <PageLayout>
      <PageTitle title="Appointments" subtitle="Your scheduled patient appointments" />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!data && !error && <Spinner />}
      {data && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Patient</th><th>Date</th><th>Time</th><th>Reason</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No appointments</td></tr>}
                {data.map(a => (
                  <tr key={a.appointmentId}>
                    <td>{a.appointmentId}</td>
                    <td>{a.patientName}</td>
                    <td>{formatDate(a.appointmentDate)}</td>
                    <td style={{ fontSize: 12 }}>{a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : '—'}</td>
                    <td>{a.reasonForVisit || '—'}</td>
                    <td><StatusBadge status={a.priority || 'NORMAL'} /></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <AppointmentStatusSelect appointment={a} onChange={changeStatus} />{' '}
                      <button className="btn btn-outline btn-sm" onClick={() => setHistory(a)}>History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {history && <PatientHistoryDialog patientId={history.patientId} patientName={history.patientName} onClose={() => setHistory(null)} />}
    </PageLayout>
  )
}
