import { useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import axiosInstance from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatDate } from '../../utils/formatters'
export default function DoctorAppointments() {
  const { user } = useAuth()
  const { data, loading, error, execute } = useApi()
  useEffect(() => { execute(() => axiosInstance.get(ENDPOINTS.APPOINTMENTS_BY_DOCTOR(user.userId))) }, [user.userId])
  return (
    <PageLayout>
      <PageTitle title="Appointments" subtitle="Your scheduled patient appointments" />
      {loading && <Spinner />}
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <div className="card" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Patient</th><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {data.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'var(--color-text-muted)'}}>No appointments</td></tr>}
                {data.map(a=>(
                  <tr key={a.appointmentId}>
                    <td>{a.appointmentId}</td><td>{a.patientName}</td>
                    <td>{formatDate(a.appointmentDate)}</td><td>{a.reasonForVisit||'—'}</td>
                    <td><StatusBadge status={a.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
