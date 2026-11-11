import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import QueueTable from '../../components/queue/QueueTable'
import PatientHistoryDialog from '../../components/clinical/PatientHistoryDialog'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { Alert, Button, ErrorState, LoadingState, useConfirm, useToast } from '../../components/ui'

const REFRESH_MS = 5000

/** Today's queue for the logged-in doctor; refreshes itself every few seconds. */
export default function DoctorQueue() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const [queue, setQueue] = useState(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  async function load() {
    try {
      const res = await axiosInstance.get(ENDPOINTS.QUEUE(user.userId))
      setQueue(res.data)
      setUpdatedAt(new Date())
      setLoadError('')
    } catch (err) {
      setLoadError(errorMessage(err, 'Unable to load the queue.'))
    }
  }
  usePolling(load, REFRESH_MS, [user.userId])

  async function act(request, success) {
    setBusy(true)
    setError('')
    try {
      const res = await request()
      toast.success(typeof success === 'function' ? success(res.data) : success)
      await load()
    } catch (err) {
      setError(errorMessage(err, 'That did not work.'))
    } finally {
      setBusy(false)
    }
  }

  const callNext = () =>
    act(
      () => axiosInstance.post(ENDPOINTS.QUEUE_CALL_NEXT(user.userId)),
      e => `${e.patientName} has been called in.`,
    )

  async function noShow(e) {
    const ok = await confirm({
      title: `Mark ${e.patientName} as a no-show?`,
      message: 'They leave the queue and the appointment is closed.',
      confirmLabel: 'Mark no-show',
      danger: true,
    })
    if (ok) act(() => axiosInstance.post(ENDPOINTS.QUEUE_NO_SHOW(e.queueId)), `${e.patientName} marked as a no-show.`)
  }

  const waiting = queue?.filter(e => e.visitStatus === 'WAITING').length ?? 0
  const current = queue?.find(e => e.visitStatus === 'CALLED' || e.visitStatus === 'IN_CONSULTATION')

  function actions(e) {
    const historyBtn = (
      <Button variant="outline" size="sm" onClick={() => setHistory(e)}>
        History
      </Button>
    )
    if (e.visitStatus === 'CALLED')
      return (
        <>
          <Button
            size="sm"
            disabled={busy}
            data-testid="start-btn"
            onClick={() =>
              act(
                () => axiosInstance.post(ENDPOINTS.QUEUE_START(e.queueId)),
                `Consultation with ${e.patientName} started.`,
              )
            }
          >
            Start
          </Button>
          <Button variant="danger-outline" size="sm" disabled={busy} onClick={() => noShow(e)}>
            No-show
          </Button>
          {historyBtn}
        </>
      )
    if (e.visitStatus === 'IN_CONSULTATION')
      return (
        <>
          <Button
            size="sm"
            disabled={busy}
            data-testid="write-prescription-btn"
            onClick={() => navigate(`/doctor/prescriptions?appointmentId=${e.appointmentId}`)}
          >
            Write prescription
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            data-testid="finish-btn"
            onClick={() =>
              act(() => axiosInstance.post(ENDPOINTS.QUEUE_FINISH(e.queueId)), `Visit with ${e.patientName} finished.`)
            }
          >
            Finish
          </Button>
          {historyBtn}
        </>
      )
    if (e.visitStatus === 'FINISHED')
      return e.hasPrescription ? (
        <span className="text-success text-xs">Prescribed</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/doctor/prescriptions?appointmentId=${e.appointmentId}`)}
        >
          Write prescription
        </Button>
      )
    return historyBtn
  }

  return (
    <PageLayout>
      <PageTitle title="Today's Queue" subtitle="High priority first, then by slot time. Updates automatically." />
      <Alert tone="error">{error}</Alert>
      <ErrorState message={loadError} onRetry={load} />

      <div className="toolbar">
        <Button onClick={callNext} disabled={busy || !!current || waiting === 0} data-testid="call-next-btn">
          Call next patient
        </Button>
        <span className="muted text-sm">
          {current
            ? `Now: ${current.patientName} (${current.visitStatus === 'CALLED' ? 'called' : 'in consultation'})`
            : 'Nobody called yet'}
          {' · '}
          {waiting} waiting
          {updatedAt &&
            ` · updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
        </span>
      </div>

      {queue === null ? (
        <LoadingState label="Loading today's queue…" />
      ) : (
        <QueueTable entries={queue} renderActions={actions} emptyText="Nobody is waiting today." />
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
