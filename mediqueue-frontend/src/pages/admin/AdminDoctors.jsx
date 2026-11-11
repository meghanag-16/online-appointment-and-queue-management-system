import { Fragment, useState, useEffect } from 'react'
import { getAllDoctors, onboardDoctor, deactivateDoctor, updateDoctor, getAllDepartments } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { drName } from '../../utils/formatters'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import UserProfileForm from '../../components/forms/UserProfileForm'
import TemporaryPasswordNotice from '../../components/common/TemporaryPasswordNotice'

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [departments, setDepartments] = useState([])
  const [editing, setEditing] = useState(null) // { doctorId, departmentId, specialization, qualification, consultationFee }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDoctors()
    getAllDepartments()
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]))
  }, [])

  const startEdit = doc => {
    setMessage('')
    setError('')
    setEditing({
      doctorId: doc.userId,
      departmentId: doc.departmentId || '',
      specialization: doc.specialization || '',
      qualification: doc.qualification || '',
      consultationFee: doc.consultationFee ?? '',
    })
  }

  const saveEdit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { doctorId, ...details } = editing
      const res = await updateDoctor(doctorId, {
        ...details,
        consultationFee: details.consultationFee === '' ? null : details.consultationFee,
      })
      setMessage(`${drName(res.data.name)} updated. New bookings use the new fee.`)
      setEditing(null)
      fetchDoctors()
    } catch (err) {
      setError(errorMessage(err, 'Could not update the doctor.'))
    } finally {
      setSaving(false)
    }
  }

  const setField = field => e => setEditing(ed => ({ ...ed, [field]: e.target.value }))

  const fetchDoctors = async () => {
    try {
      const res = await getAllDoctors()
      setDoctors(res.data)
    } catch (err) {
      setDoctors([])
      setError(errorMessage(err, 'Could not load doctors.'))
    }
  }

  // Same form and same backend fields as doctor self-registration (no hard-coded password).
  const handleOnboard = async payload => {
    setMessage('')
    setError('')
    setCredentials(null)
    const res = await onboardDoctor(payload)
    const d = res.data.user
    setCredentials({ name: drName(d.name), username: d.username, password: res.data.temporaryPassword })
    fetchDoctors()
  }

  const handleDeactivate = async doctorId => {
    if (
      !window.confirm(
        'Deactivate this doctor? They will no longer be able to log in, and their upcoming appointments will be cancelled (each patient is notified).',
      )
    )
      return
    try {
      await deactivateDoctor(doctorId)
      setMessage('Doctor deactivated. Their upcoming appointments were cancelled and the patients notified.')
      setError('')
      fetchDoctors()
    } catch (err) {
      setError(errorMessage(err, 'Failed to deactivate doctor.'))
    }
  }

  return (
    <PageLayout>
      <PageTitle title="Doctors Management" subtitle="Onboard and manage doctors" />
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {credentials && <TemporaryPasswordNotice {...credentials} onClose={() => setCredentials(null)} />}

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '4px' }}>Onboard New Doctor</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Choose their department; a temporary password is generated, which they must change at first login.
          </p>
          <UserProfileForm
            fixedRole="DOCTOR"
            submitLabel="Onboard Doctor"
            showPassword={false}
            resetOnSuccess
            onSubmit={handleOnboard}
          />
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>All Doctors</h3>
          {doctors.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No doctors found.</p>
          ) : (
            doctors.map(doc => {
              const doctorId = doc.userId || doc.id
              return (
                <Fragment key={doctorId}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <strong>{doc.name || doc.username}</strong>{' '}
                      {doc.accountStatus && <StatusBadge status={doc.accountStatus} />}
                      <p style={{ margin: '2px 0 0', fontSize: '13px' }}>
                        {doc.specialization || 'Doctor'}
                        {doc.departmentName ? ` · ${doc.departmentName}` : ''} | {doc.email}
                      </p>
                      {doc.qualification && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          🎓 {doc.qualification}
                        </p>
                      )}
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        💰 Consultation Fee: ₹{doc.consultationFee ?? 0}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(doc)}>
                        Edit
                      </button>
                      {doc.accountStatus !== 'DEACTIVATED' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleDeactivate(doctorId)}>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                  {editing?.doctorId === doctorId && (
                    <form
                      onSubmit={saveEdit}
                      data-testid={`edit-doctor-${doctorId}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 10,
                        padding: '12px 0 16px',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="ed-dept">Department</label>
                        <select
                          id="ed-dept"
                          className="form-control"
                          value={editing.departmentId}
                          onChange={setField('departmentId')}
                          required
                        >
                          <option value="">Choose…</option>
                          {departments.map(d => (
                            <option key={d.departmentId} value={d.departmentId}>
                              {d.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="ed-spec">Specialization</label>
                        <input
                          id="ed-spec"
                          className="form-control"
                          maxLength={100}
                          value={editing.specialization}
                          onChange={setField('specialization')}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="ed-qual">Qualification</label>
                        <input
                          id="ed-qual"
                          className="form-control"
                          maxLength={200}
                          value={editing.qualification}
                          onChange={setField('qualification')}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="ed-fee">Consultation fee (₹)</label>
                        <input
                          id="ed-fee"
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          value={editing.consultationFee}
                          onChange={setField('consultationFee')}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </Fragment>
              )
            })
          )}
        </div>
      </div>
    </PageLayout>
  )
}
