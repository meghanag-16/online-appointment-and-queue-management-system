import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import StatusBadge from '../../components/common/StatusBadge'
import PatientPicker from '../../components/booking/PatientPicker'
import DoctorPicker from '../../components/booking/DoctorPicker'
import SlotPicker from '../../components/booking/SlotPicker'
import AlternateSlots from '../../components/booking/AlternateSlots'
import RescheduleDialog from '../../components/booking/RescheduleDialog'
import AppointmentStatusSelect from '../../components/booking/AppointmentStatusSelect'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot, formatTime } from '../../utils/dates'
import { formatEnum } from '../../utils/formatters'

const STATUS_OPTIONS = ['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterName, setFilterName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rescheduling, setRescheduling] = useState(null)

  // Book-for-patient form
  const [showBook, setShowBook] = useState(false)
  const [patient, setPatient] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [slot, setSlot] = useState(null)
  const [reason, setReason] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [bookErr, setBookErr] = useState('')
  const [alternates, setAlternates] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [filterDate]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAppointments() {
    setLoading(true)
    try {
      const res = await axiosInstance.get(ENDPOINTS.APPOINTMENTS_ALL(filterDate))
      setAppointments(res.data)
    } catch (err) {
      setAppointments([])
      setError(errorMessage(err, 'Could not load appointments.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(a, status) {
    if (status === 'CANCELLED' && !window.confirm(`Cancel ${a.patientName}'s appointment? The slot will be freed.`))
      return
    setMessage('')
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_STATUS(a.appointmentId), { status })
      setMessage(`Appointment ${a.appointmentId} marked ${formatEnum(status)}.`)
      fetchAppointments()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the status.'))
    }
  }

  async function togglePriority(a) {
    const next = a.priority === 'HIGH_PRIORITY' ? 'NORMAL' : 'HIGH_PRIORITY'
    setMessage('')
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.APPOINTMENT_PRIORITY(a.appointmentId), { priority: next })
      setMessage(
        `${a.patientName} is now ${next === 'HIGH_PRIORITY' ? 'high priority — moved up in the queue' : 'normal priority'}.`,
      )
      fetchAppointments()
    } catch (err) {
      setError(errorMessage(err, 'Could not change the priority.'))
    }
  }

  async function handleCancel(a) {
    if (!window.confirm(`Cancel ${a.patientName}'s appointment on ${formatSlot(a.startTime)}?`)) return
    setMessage('')
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.CANCEL_APPOINTMENT(a.appointmentId))
      setMessage('Appointment cancelled and the slot freed.')
      fetchAppointments()
    } catch (err) {
      setError(errorMessage(err, 'Could not cancel the appointment.'))
    }
  }

  function resetBooking() {
    setPatient(null)
    setDoctor(null)
    setSlot(null)
    setReason('')
    setPriority('NORMAL')
    setBookErr('')
    setAlternates([])
  }

  async function handleBook(e) {
    e.preventDefault()
    if (!patient || !doctor || !slot) {
      setBookErr('Choose a patient, a doctor and a time slot.')
      return
    }
    setBookErr('')
    setMessage('')
    setAlternates([])
    setBooking(true)
    try {
      const res = await axiosInstance.post(ENDPOINTS.APPOINTMENTS, {
        patientId: patient.userId,
        doctorId: doctor.userId,
        slotId: slot.slotId,
        reasonForVisit: reason,
        priority,
      })
      setMessage(`Booked ${res.data.patientName} with ${res.data.doctorName} on ${formatSlot(res.data.startTime)}.`)
      resetBooking()
      setShowBook(false)
      fetchAppointments()
    } catch (err) {
      setBookErr(errorMessage(err, 'Booking failed.'))
      setAlternates(err.response?.data?.alternateSlots || [])
      setSlot(null)
      setRefreshKey(k => k + 1)
    } finally {
      setBooking(false)
    }
  }

  function pickAlternate(alt) {
    if (alt.doctorId !== doctor?.userId) setDoctor({ userId: alt.doctorId, name: alt.doctorName })
    setSlot({ slotId: alt.slotId, startTime: alt.startTime, endTime: alt.endTime })
    setAlternates([])
    setBookErr('')
  }

  const filtered = appointments.filter(a => {
    const matchStatus = !filterStatus || a.status === filterStatus
    const q = filterName.toLowerCase()
    const matchName = !q || a.patientName?.toLowerCase().includes(q) || a.doctorName?.toLowerCase().includes(q)
    return matchStatus && matchName
  })

  const labelStyle = { fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }
  const filterInput = { padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 14 }

  return (
    <PageLayout>
      <PageTitle title="Appointments" subtitle="View, manage and book appointments" />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle} htmlFor="f-date">
            Filter by Date
          </label>
          <input
            id="f-date"
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={filterInput}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="f-status">
            Filter by Status
          </label>
          <select
            id="f-status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={filterInput}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {formatEnum(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="f-name">
            Search Name
          </label>
          <input
            id="f-name"
            placeholder="Patient or doctor name"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            style={filterInput}
          />
        </div>
        <button className="btn btn-outline" onClick={fetchAppointments}>
          Refresh
        </button>
        <button
          className={showBook ? 'btn btn-outline' : 'btn btn-dark'}
          data-testid="book-for-patient"
          onClick={() => {
            setShowBook(b => !b)
            resetBooking()
          }}
        >
          {showBook ? '✕ Close' : '+ Book for Patient'}
        </button>
      </div>

      {showBook && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={handleBook}>
          <h3 style={{ marginBottom: 16 }}>Book appointment for a patient</h3>
          {bookErr && <div className="alert alert-error">{bookErr}</div>}

          <div className="form-group">
            <label>1. Patient</label>
            <PatientPicker selected={patient} onSelect={setPatient} />
          </div>
          <div className="form-group">
            <label>2. Doctor</label>
            <DoctorPicker
              compact
              selectedDoctorId={doctor?.userId}
              onSelect={d => {
                setDoctor(d)
                setSlot(null)
                setAlternates([])
              }}
            />
          </div>
          {doctor && (
            <div className="form-group">
              <label>3. Time with {doctor.name}</label>
              <SlotPicker
                doctorId={doctor.userId}
                selectedSlotId={slot?.slotId}
                onSelect={setSlot}
                refreshKey={refreshKey}
              />
            </div>
          )}
          <AlternateSlots alternates={alternates} onPick={pickAlternate} />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="form-group">
              <label htmlFor="b-reason">Reason for visit</label>
              <textarea
                id="b-reason"
                className="form-control"
                rows={2}
                maxLength={2000}
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="b-priority">Priority</label>
              <select
                id="b-priority"
                className="form-control"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH_PRIORITY">High priority</option>
              </select>
            </div>
          </div>
          {slot && (
            <p style={{ marginBottom: 12 }}>
              Selected: <strong>{formatSlot(slot.startTime)}</strong>
            </p>
          )}
          <div style={{ textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" disabled={booking || !patient || !doctor || !slot}>
              {booking ? 'Booking…' : 'Book Appointment'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0 }}>{filterDate ? `Appointments on ${filterDate}` : 'All Appointments'}</h3>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{filtered.length} records</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
                      No appointments found
                    </td>
                  </tr>
                )}
                {filtered.map(a => (
                  <tr key={a.appointmentId}>
                    <td style={{ fontSize: 11 }}>{a.appointmentId}</td>
                    <td>
                      <strong style={{ fontSize: 13 }}>{a.patientName}</strong>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.patientId}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.doctorName}</td>
                    <td style={{ fontSize: 13 }}>{a.appointmentDate || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : '—'}
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 140 }}>{a.reasonForVisit || '—'}</td>
                    <td>
                      <StatusBadge status={a.priority || 'NORMAL'} />
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <AppointmentStatusSelect appointment={a} onChange={handleStatusChange} />{' '}
                      {['BOOKED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status) && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => togglePriority(a)}
                          data-testid={`priority-${a.appointmentId}`}
                        >
                          {a.priority === 'HIGH_PRIORITY' ? 'Unmark priority' : 'Mark high priority'}
                        </button>
                      )}{' '}
                      {a.canReschedule && (
                        <button className="btn btn-outline btn-sm" onClick={() => setRescheduling(a)}>
                          Reschedule
                        </button>
                      )}{' '}
                      {a.canCancel && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleCancel(a)}
                        >
                          Cancel
                        </button>
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
        <RescheduleDialog
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onDone={u => {
            setRescheduling(null)
            setMessage(`Moved to ${formatSlot(u.startTime)}.`)
            fetchAppointments()
          }}
        />
      )}
    </PageLayout>
  )
}
