import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import UserProfileForm, { ALL_ROLES } from '../../components/forms/UserProfileForm'
import { getAllUsers, createUser, updateUserStatus } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getAllUsers()
      setUsers(res.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load users.'))
    } finally {
      setLoading(false)
    }
  }

  // The only way to create doctor, lab technician, receptionist and administrator accounts.
  async function handleCreate(payload) {
    setMessage(''); setError('')
    const res = await createUser(payload)
    setMessage(`${res.data.name} (${res.data.role.replace(/_/g, ' ')}) created. They can log in as "${res.data.username}".`)
    setShowCreate(false)
    load()
  }

  async function changeStatus(u, status) {
    const verb = { ACTIVE: 'activate', SUSPENDED: 'suspend', DEACTIVATED: 'deactivate' }[status]
    if (!window.confirm(`Really ${verb} ${u.name}?`)) return
    setMessage(''); setError('')
    try {
      await updateUserStatus(u.userId, status)
      setMessage(`${u.name} is now ${status.toLowerCase()}.`)
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not change the account status.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="User Management" subtitle="Create staff accounts and manage account status. Patients sign up themselves." />
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Close' : 'Create User'}
        </button>
      </div>
      {showCreate && (
        <div className="card" style={{ maxWidth: 560, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Create User</h3>
          <UserProfileForm
            roles={ALL_ROLES}
            submitLabel="Create User"
            passwordLabel="Initial Password"
            passwordHint="Min. 8 characters — share it with the user; they can change it under My Profile"
            onSubmit={handleCreate}
          />
        </div>
      )}

      {loading && <Spinner />}
      {!loading && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>No users found</td></tr>}
                {users.map(u => {
                  const isMe = u.userId === me?.userId
                  return (
                    <tr key={u.userId}>
                      <td>{u.userId}</td><td>{u.name}</td><td>{u.username}</td>
                      <td>{u.email}</td><td>{u.role}</td>
                      <td><StatusBadge status={u.accountStatus} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isMe ? <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>You</span> : (
                          <>
                            {u.accountStatus !== 'ACTIVE' && (
                              <button className="btn btn-primary btn-sm" onClick={() => changeStatus(u, 'ACTIVE')}>
                                Activate
                              </button>
                            )}{' '}
                            {u.accountStatus === 'ACTIVE' && (
                              <button className="btn btn-outline btn-sm" onClick={() => changeStatus(u, 'SUSPENDED')}>Suspend</button>
                            )}{' '}
                            {u.accountStatus !== 'DEACTIVATED' && (
                              <button className="btn btn-outline btn-sm" onClick={() => changeStatus(u, 'DEACTIVATED')}>Deactivate</button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
