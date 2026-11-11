import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import AppointmentStatusSelect from '../../components/booking/AppointmentStatusSelect'
import PatientHistoryDialog from '../../components/clinical/PatientHistoryDialog'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatDate, formatEnum } from '../../utils/formatters'
import { formatTime } from '../../utils/dates'
import { Alert, Button, Card, ErrorState, LoadingState, Table, useToast } from '../../components/ui'

/** The doctor's appointments, with In Progress / Completed / No Show actions where allowed. */
export default function DoctorAppointments() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState(null)

  useEffect(() => {
    load()
  }, [user.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    try {
      const res = await axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_DOCTOR(user.userId))
      setData(res.data)
      setLoadError('')
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load appointments.'))
    }
  }

  async function changeStatus(a, status) {
    setError('')
    try {
      await axiosInstance.patch(ENDPOINTS.UPDATE_STATUS(a.appointmentId), { status })
      toast.success(`${a.patientName}: ${formatEnum(status)}.`)
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the status.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Appointments" subtitle="Your scheduled patient appointments" />
      <Alert tone="error">{error}</Alert>
      <ErrorState message={loadError} onRetry={load} />
      {!data && !loadError && <LoadingState label="Loading appointments…" />}
      {data && (
        <Card flush>
          <Table
            headers={['ID', 'Patient', 'Date', 'Time', 'Reason', 'Priority', 'Status', 'Update']}
            empty="No appointments yet"
            isEmpty={data.length === 0}
          >
            {data.map(a => (
              <tr key={a.appointmentId}>
                <td>{a.appointmentId}</td>
                <td>{a.patientName}</td>
                <td>{formatDate(a.appointmentDate)}</td>
                <td className="text-sm nowrap">
                  {a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : '—'}
                </td>
                <td>{a.reasonForVisit || '—'}</td>
                <td>
                  <StatusBadge status={a.priority || 'NORMAL'} />
                </td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="nowrap">
                  <div className="row">
                    <AppointmentStatusSelect appointment={a} onChange={changeStatus} />
                    <Button variant="outline" size="sm" onClick={() => setHistory(a)}>
                      History
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {history && (
        <PatientHistoryDialog
          patientId={history.patientId}
          patientName={history.patientName}
          onClose={() => setHistory(null)}
        />
      )}
    </PageLayout>
  )
}
