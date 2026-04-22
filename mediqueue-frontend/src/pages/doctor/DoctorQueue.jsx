import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatters'

export default function DoctorQueue() {
  const { user } = useAuth()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    const fetchQueue = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get(`/doctor/queue/${user.userId}`)
        setQueue(res.data)
      } catch (err) {
        setError('Unable to load queue data.')
      } finally {
        setLoading(false)
      }
    }
    fetchQueue()
  }, [user?.userId])

  return (
    <PageLayout>
      <PageTitle title="Queue" subtitle="Your waiting patients" />
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Position</th><th>Appointment</th><th>Patient</th><th>Date</th><th>Priority</th><th>Status</th></tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No queue items for today</td></tr>
                ) : (
                  queue.map(item => (
                    <tr key={item.queueId}>
                      <td>{item.queuePosition}</td>
                      <td>{item.appointmentId}</td>
                      <td>{item.patientName}</td>
                      <td>{formatDate(item.appointmentDate)}</td>
                      <td>{item.priority || '—'}</td>
                      <td>{item.visitStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
