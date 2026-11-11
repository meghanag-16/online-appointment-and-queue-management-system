import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import Spinner from '../../components/common/Spinner'
import UserProfileForm, { ALL_ROLES } from '../../components/forms/UserProfileForm'
import { getAllUsers, createUser, updateUserStatus, resetUserPassword } from '../../api/adminApi'
import TemporaryPasswordNotice from '../../components/common/TemporaryPasswordNotice'
import { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [credentials, setCredentials] = useState(null)

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
    setMessage(''); setError(''); setCredentials(null)
    const res = await createUser(payload)
    const u = res.data.user
    setCredentials({ name: `${u.name} (${(u.role || payload.role).replace(/_/g, ' ').toLowerCase()})`, username: u.username, password: res.data.temporaryPassword })
    setShowCreate(false)
    load()
  }

  async function resetPassword(u) {
    if (!window.confirm(`Give ${u.name} a new temporary password? Their current password will stop working.`)) return
    setMessage(''); setError(''); setCredentials(null)
    try {
      const res = await resetUserPassword(u.userId)
      setCredentials({ name: u.name, username: u.username, password: res.data.temporaryPassword })
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password.'))
    }
  }

  async function changeStatus(u, status) {
    const verb = { ACTIVE: 'activate', SUSPENDED: 'suspend', DEACTIVATED: 'deactivate' }[status]
    const doctorNote = u.role === 'DOCTOR' && status !== 'ACTIVE'
      ? ' Their upcoming appointments will be cancelled and each patient notified.' : ''
    if (!window.confirm(`Really ${verb} ${u.name}?${doctorNote}`)) return
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
      {credentials && <TemporaryPasswordNotice {...credentials} onClose={() => setCredentials(null)} />}

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Close' : 'Create User'}
        </button>
      </div>
      {showCreate && (
        <div className="card" style={{ maxWidth: 560, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 4 }}>Create User</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            A temporary password is generated for them; they must change it when they first log in.
          </p>
          <UserProfileForm
            roles={ALL_ROLES}
            submitLabel="Create User"
            showPassword={false}
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
                            )}{' '}
                            <button className="btn btn-outline btn-sm" onClick={() => resetPassword(u)}>Reset password</button>
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
