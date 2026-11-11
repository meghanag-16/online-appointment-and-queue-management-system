import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
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
import {
  Alert,
  Button,
  Card,
  Cell,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Table,
  Textarea,
  useConfirm,
  useToast,
} from '../../components/ui'

const STATUS_OPTIONS = ['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export default function ReceptionistAppointments() {
  const confirm = useConfirm()
  const toast = useToast()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterName, setFilterName] = useState('')
  const [loadError, setLoadError] = useState('')
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
      setLoadError('')
    } catch (err) {
      setAppointments([])
      setLoadError(errorMessage(err, 'Could not load appointments.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(a, status) {
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
      toast.success(`Appointment ${a.appointmentId} marked ${formatEnum(status)}.`)
      fetchAppointments()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the status.'))
    }
  }

  async function togglePriority(a) {
    const next = a.priority === 'HIGH_PRIORITY' ? 'NORMAL' : 'HIGH_PRIORITY'
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.APPOINTMENT_PRIORITY(a.appointmentId), { priority: next })
      toast.success(
        `${a.patientName} is now ${next === 'HIGH_PRIORITY' ? 'high priority — moved up in the queue' : 'normal priority'}.`,
      )
      fetchAppointments()
    } catch (err) {
      setError(errorMessage(err, 'Could not change the priority.'))
    }
  }

  async function handleCancel(a) {
    const ok = await confirm({
      title: `Cancel ${a.patientName}'s appointment?`,
      message: `The appointment on ${formatSlot(a.startTime)} will be cancelled and the slot freed.`,
      confirmLabel: 'Cancel appointment',
      danger: true,
    })
    if (!ok) return
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.CANCEL_APPOINTMENT(a.appointmentId))
      toast.success('Appointment cancelled and the slot freed.')
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
      toast.success(`Booked ${res.data.patientName} with ${res.data.doctorName} on ${formatSlot(res.data.startTime)}.`)
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

  return (
    <PageLayout>
      <PageTitle title="Appointments" subtitle="View, manage and book appointments" />
      <Alert tone="error">{error}</Alert>
      <ErrorState message={loadError} onRetry={fetchAppointments} />

      <div className="toolbar">
        <Input
          id="f-date"
          label="Filter by Date"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <Select
          id="f-status"
          label="Filter by Status"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          placeholder="All Statuses"
          options={STATUS_OPTIONS.map(s => ({ value: s, label: formatEnum(s) }))}
        />
        <Input
          id="f-name"
          label="Search Name"
          placeholder="Patient or doctor name"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
        />
        <Button variant="outline" onClick={fetchAppointments}>
          Refresh
        </Button>
        <Button
          variant={showBook ? 'outline' : 'dark'}
          data-testid="book-for-patient"
          onClick={() => {
            setShowBook(b => !b)
            resetBooking()
          }}
        >
          {showBook ? '✕ Close' : '+ Book for Patient'}
        </Button>
      </div>

      {showBook && (
        <Card as="form" className="mb-6" title="Book appointment for a patient" onSubmit={handleBook}>
          <Alert tone="error">{bookErr}</Alert>

          <div className="form-group">
            <span className="form-label" id="b-patient">
              1. Patient
            </span>
            <div role="group" aria-labelledby="b-patient">
              <PatientPicker selected={patient} onSelect={setPatient} />
            </div>
          </div>
          <div className="form-group">
            <span className="form-label" id="b-doctor">
              2. Doctor
            </span>
            <div role="group" aria-labelledby="b-doctor">
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
          </div>
          {doctor && (
            <div className="form-group">
              <span className="form-label" id="b-slot">
                3. Time with {doctor.name}
              </span>
              <div role="group" aria-labelledby="b-slot">
                <SlotPicker
                  doctorId={doctor.userId}
                  selectedSlotId={slot?.slotId}
                  onSelect={setSlot}
                  refreshKey={refreshKey}
                />
              </div>
            </div>
          )}
          <AlternateSlots alternates={alternates} onPick={pickAlternate} />

          <div className="grid-form mt-4">
            <Textarea
              id="b-reason"
              label="Reason for visit"
              rows={2}
              maxLength={2000}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <Select
              id="b-priority"
              label="Priority"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              hint="High priority moves the patient up in the doctor's queue and uses the emergency rate."
              options={[
                { value: 'NORMAL', label: 'Normal' },
                { value: 'HIGH_PRIORITY', label: 'High priority' },
              ]}
            />
          </div>
          {slot && (
            <p className="mb-4">
              Selected: <strong>{formatSlot(slot.startTime)}</strong>
            </p>
          )}
          <div className="row-end">
            <Button type="submit" loading={booking} disabled={!patient || !doctor || !slot} data-testid="desk-book-btn">
              Book Appointment
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingState label="Loading appointments…" />
      ) : (
        <Card
          flush
          title={filterDate ? `Appointments on ${filterDate}` : 'All Appointments'}
          actions={<span className="muted text-sm">{filtered.length} records</span>}
        >
          <Table
            headers={['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Reason', 'Priority', 'Status', 'Actions']}
            empty="No appointments found"
            isEmpty={filtered.length === 0}
            testId="desk-appointments"
          >
            {filtered.map(a => (
              <tr key={a.appointmentId} data-testid={`desk-appointment-${a.appointmentId}`}>
                <td className="text-xs">{a.appointmentId}</td>
                <td>
                  <Cell main={<strong>{a.patientName}</strong>} sub={a.patientId} />
                </td>
                <td>{a.doctorName}</td>
                <td>{a.appointmentDate || '—'}</td>
                <td className="text-sm nowrap">
                  {a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : '—'}
                </td>
                <td className="text-sm">{a.reasonForVisit || '—'}</td>
                <td>
                  <StatusBadge status={a.priority || 'NORMAL'} />
                </td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="nowrap">
                  <div className="row">
                    <AppointmentStatusSelect appointment={a} onChange={handleStatusChange} />
                    {['BOOKED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePriority(a)}
                        data-testid={`priority-${a.appointmentId}`}
                      >
                        {a.priority === 'HIGH_PRIORITY' ? 'Unmark priority' : 'Mark high priority'}
                      </Button>
                    )}
                    {a.canReschedule && (
                      <Button variant="outline" size="sm" onClick={() => setRescheduling(a)}>
                        Reschedule
                      </Button>
                    )}
                    {a.canCancel && (
                      <Button variant="danger-outline" size="sm" onClick={() => handleCancel(a)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {rescheduling && (
        <RescheduleDialog
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onDone={u => {
            setRescheduling(null)
            toast.success(`Moved to ${formatSlot(u.startTime)}.`)
            fetchAppointments()
          }}
        />
      )}
    </PageLayout>
  )
}
