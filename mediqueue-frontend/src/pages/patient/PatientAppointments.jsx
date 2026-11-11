import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import RescheduleDialog from '../../components/booking/RescheduleDialog'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot, formatTime } from '../../utils/dates'
import { formatDate } from '../../utils/formatters'
import {
  Alert,
  Button,
  Card,
  Cell,
  EmptyState,
  ErrorState,
  LoadingState,
  Table,
  useConfirm,
  useToast,
} from '../../components/ui'

export default function PatientAppointments() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [rescheduling, setRescheduling] = useState(null)

  useEffect(() => {
    load()
  }, [user.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const res = await axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_PATIENT(user.userId))
      setData(res.data)
      setLoadError('')
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load your appointments.'))
    }
  }

  async function cancel(a) {
    const ok = await confirm({
      title: 'Cancel appointment?',
      message: `Your appointment with ${a.doctorName} on ${formatSlot(a.startTime)} will be cancelled and the slot freed.`,
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      danger: true,
    })
    if (!ok) return
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.CANCEL_APPOINTMENT(a.appointmentId))
      toast.success('Appointment cancelled. The slot is free for others again.')
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not cancel the appointment.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="My Appointments" subtitle="All your past and upcoming appointments" />
      <div className="mb-4">
        <Link to="/patient/book" className="btn btn-primary">
          + Book appointment
        </Link>
      </div>
      <Alert tone="error">{error}</Alert>
      <ErrorState message={loadError} onRetry={load} />
      {!data && !loadError && <LoadingState label="Loading appointments…" />}
      {data && data.length === 0 && (
        <Card>
          <EmptyState
            icon="🗓️"
            title="No appointments yet"
            description="Book a slot with any doctor; it shows up here."
            action={
              <Link to="/patient/book" className="btn btn-primary">
                Book appointment
              </Link>
            }
          />
        </Card>
      )}
      {data && data.length > 0 && (
        <Card flush>
          <Table headers={['ID', 'Doctor', 'Date & time', 'Reason', 'Status', 'Actions']} testId="my-appointments">
            {data.map(a => (
              <tr key={a.appointmentId} data-testid={`my-appointment-${a.appointmentId}`}>
                <td>{a.appointmentId}</td>
                <td>
                  <Cell main={a.doctorName} sub={a.departmentName} />
                </td>
                <td>
                  <Cell
                    main={formatDate(a.appointmentDate)}
                    sub={a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : ''}
                  />
                </td>
                <td>{a.reasonForVisit || '—'}</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="nowrap">
                  <div className="row">
                    {a.canReschedule && (
                      <Button variant="outline" size="sm" onClick={() => setRescheduling(a)}>
                        Reschedule
                      </Button>
                    )}
                    {a.canCancel && (
                      <Button variant="danger-outline" size="sm" onClick={() => cancel(a)}>
                        Cancel
                      </Button>
                    )}
                    {!a.canCancel && ['BOOKED', 'CONFIRMED'].includes(a.status) && a.changeDeadline && (
                      <span className="muted text-xs" title="Contact the front desk to change it">
                        Too late to change online
                      </span>
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
          onDone={updated => {
            setRescheduling(null)
            toast.success(`Moved to ${formatSlot(updated.startTime)}.`)
            load()
          }}
        />
      )}
    </PageLayout>
  )
}
