import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import QueueTable from '../../components/queue/QueueTable'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import { usePolling } from '../../hooks/usePolling'

const REFRESH_MS = 5000

/**
 * Front desk and administrator view of any doctor's queue today.
 * Receptionist: mark / unmark high priority. Administrator: also move waiting patients up or down
 * (an override that pins their position) and clear the override.
 */
export default function QueueBoard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMINISTRATOR'
  const [doctors, setDoctors] = useState([])
  const [doctorId, setDoctorId] = useState('')
  const [queue, setQueue] = useState(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.DOCTORS_SEARCH())
      .then(res => { setDoctors(res.data); if (res.data[0]) setDoctorId(res.data[0].userId) })
      .catch(err => setError(errorMessage(err, 'Could not load doctors.')))
  }, [])

  async function load() {
    if (!doctorId) return
    try {
      const res = await axiosInstance.get(ENDPOINTS.QUEUE(doctorId))
      setQueue(res.data); setLoadError('')
    } catch (err) { setLoadError(errorMessage(err, 'Could not load the queue.')) }
  }
  usePolling(load, REFRESH_MS, [doctorId])

  async function act(request, success) {
    setBusy(true); setError(''); setMessage('')
    try { await request(); setMessage(success); await load() }
    catch (err) { setError(errorMessage(err, 'That did not work.')) }
    finally { setBusy(false) }
  }

  const togglePriority = (e) => {
    const next = e.priority === 'HIGH_PRIORITY' ? 'NORMAL' : 'HIGH_PRIORITY'
    act(() => axiosInstance.patch(ENDPOINTS.APPOINTMENT_PRIORITY(e.appointmentId), { priority: next }),
      `${e.patientName} is now ${next === 'HIGH_PRIORITY' ? 'high priority' : 'normal priority'}.`)
  }
  const move = (e, position) =>
    act(() => axiosInstance.patch(ENDPOINTS.QUEUE_POSITION(e.queueId), { position }),
      position == null ? `Override cleared for ${e.patientName}.` : `${e.patientName} moved to position ${position}.`)

  function actions(e) {
    if (e.visitStatus === 'FINISHED') return null
    const active = queue.filter(x => x.visitStatus !== 'FINISHED')
    const firstWaiting = active.find(x => x.visitStatus === 'WAITING')
    return <>
      <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => togglePriority(e)}
        data-testid={`priority-${e.appointmentId}`}>
        {e.priority === 'HIGH_PRIORITY' ? 'Unmark priority' : 'Mark high priority'}
      </button>
      {isAdmin && e.visitStatus === 'WAITING' && <>
        {' '}<button className="btn btn-outline btn-sm" title="Move up" disabled={busy || e.queueId === firstWaiting?.queueId}
          onClick={() => move(e, e.queuePosition - 1)}>▲</button>
        {' '}<button className="btn btn-outline btn-sm" title="Move down" disabled={busy || e.queuePosition === active.length}
          onClick={() => move(e, e.queuePosition + 1)}>▼</button>
        {e.overridePosition != null && <>{' '}<button className="btn btn-outline btn-sm" disabled={busy}
          onClick={() => move(e, null)}>Clear override</button></>}
      </>}
    </>
  }

  return (
    <PageLayout>
      <PageTitle title="Doctor Queues"
        subtitle={isAdmin ? 'Mark priority or override the order of waiting patients' : 'Mark patients high priority; the queue reorders at once'} />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loadError && <div className="alert alert-error">{loadError}</div>}
      <div className="form-group" style={{ maxWidth: 360 }}>
        <label htmlFor="qb-doctor">Doctor</label>
        <select id="qb-doctor" className="form-control" value={doctorId} onChange={e => { setDoctorId(e.target.value); setQueue(null) }}>
          {doctors.map(d => <option key={d.userId} value={d.userId}>{d.name} — {d.departmentName || d.specialization}</option>)}
        </select>
      </div>
      {queue === null ? <Spinner /> : <QueueTable entries={queue} renderActions={actions} emptyText="Nobody in this doctor's queue today." />}
    </PageLayout>
  )
}
