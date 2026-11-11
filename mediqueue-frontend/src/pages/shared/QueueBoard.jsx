import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import QueueTable from '../../components/queue/QueueTable'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { Alert, Button, ErrorState, LoadingState, Select, useToast } from '../../components/ui'

const REFRESH_MS = 5000

/**
 * Front desk and administrator view of any doctor's queue today.
 * Receptionist: mark / unmark high priority. Administrator: also move waiting patients up or down
 * (an override that pins their position) and clear the override.
 */
export default function QueueBoard() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'ADMINISTRATOR'
  const [doctors, setDoctors] = useState([])
  const [doctorId, setDoctorId] = useState('')
  const [queue, setQueue] = useState(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.DOCTORS_SEARCH())
      .then(res => {
        setDoctors(res.data)
        if (res.data[0]) setDoctorId(res.data[0].userId)
        else setQueue([])
      })
      .catch(err => setLoadError(errorMessage(err, 'Could not load doctors.')))
  }, [])

  async function load() {
    if (!doctorId) return
    try {
      const res = await axiosInstance.get(ENDPOINTS.QUEUE(doctorId))
      setQueue(res.data)
      setLoadError('')
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the queue.'))
    }
  }
  usePolling(load, REFRESH_MS, [doctorId])

  async function act(request, success) {
    setBusy(true)
    setError('')
    try {
      await request()
      toast.success(success)
      await load()
    } catch (err) {
      setError(errorMessage(err, 'That did not work.'))
    } finally {
      setBusy(false)
    }
  }

  const togglePriority = e => {
    const next = e.priority === 'HIGH_PRIORITY' ? 'NORMAL' : 'HIGH_PRIORITY'
    act(
      () => axiosInstance.patch(ENDPOINTS.APPOINTMENT_PRIORITY(e.appointmentId), { priority: next }),
      `${e.patientName} is now ${next === 'HIGH_PRIORITY' ? 'high priority' : 'normal priority'}.`,
    )
  }
  const move = (e, position) =>
    act(
      () => axiosInstance.patch(ENDPOINTS.QUEUE_POSITION(e.queueId), { position }),
      position == null ? `Override cleared for ${e.patientName}.` : `${e.patientName} moved to position ${position}.`,
    )

  function actions(e) {
    if (e.visitStatus === 'FINISHED') return null
    const active = queue.filter(x => x.visitStatus !== 'FINISHED')
    const firstWaiting = active.find(x => x.visitStatus === 'WAITING')
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => togglePriority(e)}
          data-testid={`priority-${e.appointmentId}`}
        >
          {e.priority === 'HIGH_PRIORITY' ? 'Unmark priority' : 'Mark high priority'}
        </Button>
        {isAdmin && e.visitStatus === 'WAITING' && (
          <>
            <Button
              variant="outline"
              size="sm"
              title="Move up"
              aria-label={`Move ${e.patientName} up`}
              disabled={busy || e.queueId === firstWaiting?.queueId}
              onClick={() => move(e, e.queuePosition - 1)}
            >
              ▲
            </Button>
            <Button
              variant="outline"
              size="sm"
              title="Move down"
              aria-label={`Move ${e.patientName} down`}
              disabled={busy || e.queuePosition === active.length}
              onClick={() => move(e, e.queuePosition + 1)}
            >
              ▼
            </Button>
            {e.overridePosition != null && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => move(e, null)}>
                Clear override
              </Button>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <PageLayout>
      <PageTitle
        title="Doctor Queues"
        subtitle={
          isAdmin
            ? 'Mark priority or override the order of waiting patients'
            : 'Mark patients high priority; the queue reorders at once'
        }
      />
      <Alert tone="error">{error}</Alert>
      <ErrorState message={loadError} onRetry={load} />
      <Select
        id="qb-doctor"
        label="Doctor"
        fieldClassName="max-w-sm"
        value={doctorId}
        onChange={e => {
          setDoctorId(e.target.value)
          setQueue(null)
        }}
        options={doctors.map(d => ({ value: d.userId, label: `${d.name} — ${d.departmentName || d.specialization}` }))}
      />
      {queue === null ? (
        <LoadingState label="Loading queue…" />
      ) : (
        <QueueTable entries={queue} renderActions={actions} emptyText="Nobody in this doctor's queue today." />
      )}
    </PageLayout>
  )
}
