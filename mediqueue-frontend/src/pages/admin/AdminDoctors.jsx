import { Fragment, useEffect, useState } from 'react'
import { getAllDoctors, onboardDoctor, deactivateDoctor, updateDoctor, getAllDepartments } from '../../api/adminApi'
import { errorMessage } from '../../api/axiosInstance'
import { drName } from '../../utils/formatters'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import StatusBadge from '../../components/common/StatusBadge'
import UserProfileForm from '../../components/forms/UserProfileForm'
import TemporaryPasswordNotice from '../../components/common/TemporaryPasswordNotice'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  useConfirm,
  useToast,
} from '../../components/ui'

export default function AdminDoctors() {
  const confirm = useConfirm()
  const toast = useToast()
  const [doctors, setDoctors] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [departments, setDepartments] = useState([])
  const [editing, setEditing] = useState(null) // { doctorId, departmentId, specialization, qualification, consultationFee }
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDoctors()
    getAllDepartments()
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]))
  }, [])

  async function fetchDoctors() {
    try {
      setDoctors((await getAllDoctors()).data)
      setLoadError('')
    } catch (err) {
      setDoctors([])
      setLoadError(errorMessage(err, 'Could not load doctors.'))
    }
  }

  // Same form and same backend fields as patient self-registration (no hard-coded password).
  async function handleOnboard(payload) {
    setError('')
    setCredentials(null)
    const res = await onboardDoctor(payload)
    const d = res.data.user
    setCredentials({ name: drName(d.name), username: d.username, password: res.data.temporaryPassword })
    fetchDoctors()
  }

  async function handleDeactivate(doc) {
    const ok = await confirm({
      title: `Deactivate ${drName(doc.name)}?`,
      message:
        'They will no longer be able to log in, and their upcoming appointments will be cancelled (each patient is notified).',
      confirmLabel: 'Deactivate',
      danger: true,
    })
    if (!ok) return
    setError('')
    try {
      await deactivateDoctor(doc.userId)
      toast.success(`${drName(doc.name)} deactivated. Their upcoming appointments were cancelled.`)
      fetchDoctors()
    } catch (err) {
      setError(errorMessage(err, 'Failed to deactivate doctor.'))
    }
  }

  function startEdit(doc) {
    setError('')
    setEditErrors({})
    setEditing({
      doctorId: doc.userId,
      departmentId: doc.departmentId || '',
      specialization: doc.specialization || '',
      qualification: doc.qualification || '',
      consultationFee: doc.consultationFee ?? '',
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)
    setEditErrors({})
    try {
      const { doctorId, ...details } = editing
      const res = await updateDoctor(doctorId, {
        ...details,
        consultationFee: details.consultationFee === '' ? null : details.consultationFee,
      })
      toast.success(`${drName(res.data.name)} updated. New bookings use the new fee.`)
      setEditing(null)
      fetchDoctors()
    } catch (err) {
      setEditErrors({
        form: errorMessage(err, 'Could not update the doctor.'),
        ...(err.response?.data?.fieldErrors || {}),
      })
    } finally {
      setSaving(false)
    }
  }

  const setField = field => e => setEditing(ed => ({ ...ed, [field]: e.target.value }))

  return (
    <PageLayout>
      <PageTitle title="Doctors" subtitle="Onboard, edit and deactivate doctors" />
      <div className="stack max-w-lg">
        <Alert tone="error">{error}</Alert>
        {credentials && <TemporaryPasswordNotice {...credentials} onClose={() => setCredentials(null)} />}

        <Card
          title="Onboard new doctor"
          subtitle="Choose their department; a temporary password is generated, which they must change at first login."
        >
          <UserProfileForm
            fixedRole="DOCTOR"
            submitLabel="Onboard Doctor"
            showPassword={false}
            resetOnSuccess
            onSubmit={handleOnboard}
          />
        </Card>

        <Card title="All doctors">
          <ErrorState message={loadError} onRetry={fetchDoctors} />
          {doctors === null && <LoadingState label="Loading doctors…" />}
          {doctors?.length === 0 && !loadError && <EmptyState icon="🩺" title="No doctors yet" />}
          <div className="divider-list">
            {doctors?.map(doc => (
              <Fragment key={doc.userId}>
                <div className="row-between" data-testid={`doctor-row-${doc.userId}`}>
                  <div>
                    <strong>{doc.name || doc.username}</strong>{' '}
                    {doc.accountStatus && <StatusBadge status={doc.accountStatus} />}
                    <p className="text-sm">
                      {doc.specialization || 'Doctor'}
                      {doc.departmentName ? ` · ${doc.departmentName}` : ''} · {doc.email}
                    </p>
                    <p className="muted text-xs">
                      {doc.qualification ? `${doc.qualification} · ` : ''}Consultation fee ₹{doc.consultationFee ?? 0}
                    </p>
                  </div>
                  <div className="row">
                    <Button variant="outline" size="sm" onClick={() => startEdit(doc)}>
                      Edit
                    </Button>
                    {doc.accountStatus !== 'DEACTIVATED' && (
                      <Button variant="danger-outline" size="sm" onClick={() => handleDeactivate(doc)}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
                {editing?.doctorId === doc.userId && (
                  <form onSubmit={saveEdit} data-testid={`edit-doctor-${doc.userId}`}>
                    <Alert tone="error">{editErrors.form}</Alert>
                    <div className="grid-form">
                      <Select
                        id="ed-dept"
                        label="Department"
                        required
                        value={editing.departmentId}
                        onChange={setField('departmentId')}
                        placeholder="Choose…"
                        options={departments.map(d => ({ value: d.departmentId, label: d.departmentName }))}
                        error={editErrors.departmentId}
                      />
                      <Input
                        id="ed-spec"
                        label="Specialization"
                        required
                        maxLength={100}
                        value={editing.specialization}
                        onChange={setField('specialization')}
                        error={editErrors.specialization}
                      />
                      <Input
                        id="ed-qual"
                        label="Qualification"
                        maxLength={200}
                        value={editing.qualification}
                        onChange={setField('qualification')}
                      />
                      <Input
                        id="ed-fee"
                        label="Consultation fee (₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editing.consultationFee}
                        onChange={setField('consultationFee')}
                        error={editErrors.consultationFee}
                      />
                    </div>
                    <div className="row-end">
                      <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" loading={saving}>
                        Save
                      </Button>
                    </div>
                  </form>
                )}
              </Fragment>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
