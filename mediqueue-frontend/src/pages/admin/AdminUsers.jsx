import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import UserProfileForm, { ALL_ROLES } from '../../components/forms/UserProfileForm'
import { getAllUsers, createUser, updateUserStatus, resetUserPassword } from '../../api/adminApi'
import TemporaryPasswordNotice from '../../components/common/TemporaryPasswordNotice'
import { errorMessage } from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { formatEnum } from '../../utils/formatters'
import { Alert, Button, Card, ErrorState, Input, LoadingState, Table, useConfirm, useToast } from '../../components/ui'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [users, setUsers] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setUsers((await getAllUsers()).data)
      setLoadError('')
    } catch (err) {
      setUsers([])
      setLoadError(errorMessage(err, 'Could not load users.'))
    }
  }

  // The only way to create doctor, lab technician, receptionist and administrator accounts.
  async function handleCreate(payload) {
    setError('')
    setCredentials(null)
    const res = await createUser(payload)
    const u = res.data.user
    setCredentials({
      name: `${u.name} (${(u.role || payload.role).replace(/_/g, ' ').toLowerCase()})`,
      username: u.username,
      password: res.data.temporaryPassword,
    })
    setShowCreate(false)
    load()
  }

  async function resetPassword(u) {
    const ok = await confirm({
      title: `Reset ${u.name}'s password?`,
      message: 'Their current password will stop working. They get a temporary one to change at next login.',
      confirmLabel: 'Reset password',
      danger: true,
    })
    if (!ok) return
    setError('')
    setCredentials(null)
    try {
      const res = await resetUserPassword(u.userId)
      setCredentials({ name: u.name, username: u.username, password: res.data.temporaryPassword })
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password.'))
    }
  }

  async function changeStatus(u, status) {
    const verb = { ACTIVE: 'Activate', SUSPENDED: 'Suspend', DEACTIVATED: 'Deactivate' }[status]
    const doctorNote =
      u.role === 'DOCTOR' && status !== 'ACTIVE'
        ? ' Their upcoming appointments will be cancelled and each patient notified.'
        : ''
    const ok = await confirm({
      title: `${verb} ${u.name}?`,
      message:
        (status === 'ACTIVE' ? 'They will be able to log in again.' : 'They will be logged out straight away.') +
        doctorNote,
      confirmLabel: verb,
      danger: status !== 'ACTIVE',
    })
    if (!ok) return
    setError('')
    try {
      await updateUserStatus(u.userId, status)
      toast.success(`${u.name} is now ${status.toLowerCase()}.`)
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not change the account status.'))
    }
  }

  const q = search.trim().toLowerCase()
  const shown = (users || []).filter(
    u => !q || [u.name, u.username, u.email, u.userId, u.role].some(v => v && v.toLowerCase().includes(q)),
  )

  return (
    <PageLayout>
      <PageTitle
        title="User Management"
        subtitle="Create staff accounts and manage account status. Patients sign up themselves."
      />
      <Alert tone="error">{error}</Alert>
      {credentials && <TemporaryPasswordNotice {...credentials} onClose={() => setCredentials(null)} />}

      <div className="toolbar">
        <Button onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Close' : 'Create User'}</Button>
        <Input
          id="user-search"
          label="Search"
          placeholder="Name, username, email, role or ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fieldClassName="push-right"
        />
      </div>
      {showCreate && (
        <Card
          className="max-w-sm mb-6"
          title="Create user"
          subtitle="A temporary password is generated for them; they must change it when they first log in."
        >
          <UserProfileForm roles={ALL_ROLES} submitLabel="Create User" showPassword={false} onSubmit={handleCreate} />
        </Card>
      )}

      <ErrorState message={loadError} onRetry={load} />
      {users === null ? (
        <LoadingState label="Loading users…" />
      ) : (
        <Card flush>
          <Table
            headers={['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Actions']}
            empty={users.length ? 'No users match the search' : 'No users found'}
            isEmpty={shown.length === 0}
          >
            {shown.map(u => {
              const isMe = u.userId === me?.userId
              return (
                <tr key={u.userId}>
                  <td className="text-xs">{u.userId}</td>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{formatEnum(u.role)}</td>
                  <td>
                    <StatusBadge status={u.accountStatus} />
                  </td>
                  <td className="nowrap">
                    {isMe ? (
                      <span className="muted text-sm">You</span>
                    ) : (
                      <div className="row">
                        {u.accountStatus !== 'ACTIVE' && (
                          <Button size="sm" onClick={() => changeStatus(u, 'ACTIVE')}>
                            Activate
                          </Button>
                        )}
                        {u.accountStatus === 'ACTIVE' && (
                          <Button variant="outline" size="sm" onClick={() => changeStatus(u, 'SUSPENDED')}>
                            Suspend
                          </Button>
                        )}
                        {u.accountStatus !== 'DEACTIVATED' && (
                          <Button variant="danger-outline" size="sm" onClick={() => changeStatus(u, 'DEACTIVATED')}>
                            Deactivate
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => resetPassword(u)}>
                          Reset password
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </Table>
        </Card>
      )}
    </PageLayout>
  )
}
