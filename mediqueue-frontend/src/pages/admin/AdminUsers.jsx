import { useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import { useApi } from '../../hooks/useApi'
import axiosInstance from '../../api/axiosInstance'
export default function AdminUsers() {
  const { data, loading, error, execute } = useApi()
  useEffect(() => { execute(() => axiosInstance.get('/users')) }, [])
  return (
    <PageLayout>
      <PageTitle title="User Management" subtitle="View and manage all registered users" />
      {loading && <Spinner />}
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <div className="card" style={{padding:0}}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {data.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:24,color:'var(--color-text-muted)'}}>No users found</td></tr>}
                {data.map(u=>(
                  <tr key={u.userId}>
                    <td>{u.userId}</td><td>{u.name}</td><td>{u.username}</td>
                    <td>{u.email}</td><td>{u.role}</td>
                    <td><StatusBadge status={u.accountStatus}/></td>
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
