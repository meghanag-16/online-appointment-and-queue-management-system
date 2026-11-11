import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import QueueTable from '../../components/queue/QueueTable'
import PatientHistoryDialog from '../../components/clinical/PatientHistoryDialog'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { usePolling } from '../../hooks/usePolling'

const REFRESH_MS = 5000

/** Today's queue for the logged-in doctor; refreshes itself every few seconds. */
export default function DoctorQueue() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [queue, setQueue] = useState(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
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
    setMessage('')
    try {
      const res = await request()
      setMessage(typeof success === 'function' ? success(res.data) : success)
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

  const waiting = queue?.filter(e => e.visitStatus === 'WAITING').length ?? 0
  const current = queue?.find(e => e.visitStatus === 'CALLED' || e.visitStatus === 'IN_CONSULTATION')

  function actions(e) {
    const historyBtn = (
      <button className="btn btn-outline btn-sm" onClick={() => setHistory(e)}>
        History
      </button>
    )
    if (e.visitStatus === 'CALLED')
      return (
        <>
          <button
            className="btn btn-primary btn-sm"
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
          </button>{' '}
          <button
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() =>
              window.confirm(`Mark ${e.patientName} as a no-show?`) &&
              act(() => axiosInstance.post(ENDPOINTS.QUEUE_NO_SHOW(e.queueId)), `${e.patientName} marked as a no-show.`)
            }
          >
            No-show
          </button>{' '}
          {historyBtn}
        </>
      )
    if (e.visitStatus === 'IN_CONSULTATION')
      return (
        <>
          <button
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => navigate(`/doctor/prescriptions?appointmentId=${e.appointmentId}`)}
          >
            Write prescription
          </button>{' '}
          <button
            className="btn btn-outline btn-sm"
            disabled={busy}
            data-testid="finish-btn"
            onClick={() =>
              act(() => axiosInstance.post(ENDPOINTS.QUEUE_FINISH(e.queueId)), `Visit with ${e.patientName} finished.`)
            }
          >
            Finish
          </button>{' '}
          {historyBtn}
        </>
      )
    if (e.visitStatus === 'FINISHED')
      return e.hasPrescription ? (
        <span style={{ fontSize: 12, color: 'var(--color-success)' }}>Prescribed</span>
      ) : (
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate(`/doctor/prescriptions?appointmentId=${e.appointmentId}`)}
        >
          Write prescription
        </button>
      )
    return historyBtn
  }

  return (
    <PageLayout>
      <PageTitle title="Today's Queue" subtitle="High priority first, then by slot time. Updates automatically." />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loadError && <div className="alert alert-error">{loadError}</div>}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          className="btn btn-primary"
          onClick={callNext}
          disabled={busy || !!current || waiting === 0}
          data-testid="call-next-btn"
        >
          Call next patient
        </button>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
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
        <Spinner />
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
