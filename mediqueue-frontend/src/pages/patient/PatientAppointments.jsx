import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import RescheduleDialog from '../../components/booking/RescheduleDialog'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot, formatTime } from '../../utils/dates'
import { formatDate } from '../../utils/formatters'

export default function PatientAppointments() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [rescheduling, setRescheduling] = useState(null)

  useEffect(() => { load() }, [user.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const res = await axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_PATIENT(user.userId))
      setData(res.data); setError('')
    } catch (err) {
      setError(errorMessage(err, 'Could not load your appointments.'))
    } finally { setLoading(false) }
  }

  async function cancel(a) {
    if (!window.confirm(`Cancel your appointment with ${a.doctorName} on ${formatSlot(a.startTime)}?`)) return
    setMessage(''); setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.CANCEL_APPOINTMENT(a.appointmentId))
      setMessage('Appointment cancelled. The slot is free for others again.')
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not cancel the appointment.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="My Appointments" subtitle="All your past and upcoming appointments" />
      <div style={{ marginBottom: 16 }}>
        <Link to="/patient/book" className="btn btn-primary">+ Book appointment</Link>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && !data && <Spinner />}
      {data && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>ID</th><th>Doctor</th><th>Date &amp; time</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No appointments found</td></tr>
                )}
                {data.map(a => (
                  <tr key={a.appointmentId}>
                    <td>{a.appointmentId}</td>
                    <td>
                      {a.doctorName}
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.departmentName}</div>
                    </td>
                    <td>
                      {formatDate(a.appointmentDate)}
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : ''}
                      </div>
                    </td>
                    <td>{a.reasonForVisit || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {a.canReschedule && (
                        <button className="btn btn-outline btn-sm" onClick={() => setRescheduling(a)}>Reschedule</button>
                      )}{' '}
                      {a.canCancel && (
                        <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => cancel(a)}>Cancel</button>
                      )}
                      {!a.canCancel && ['BOOKED', 'CONFIRMED'].includes(a.status) && a.changeDeadline && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }} title="Contact the front desk to change it">
                          Too late to change online
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rescheduling && (
        <RescheduleDialog appointment={rescheduling} onClose={() => setRescheduling(null)}
          onDone={(updated) => {
            setRescheduling(null)
            setMessage(`Moved to ${formatSlot(updated.startTime)}.`)
            load()
          }} />
      )}
    </PageLayout>
  )
}
