import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { todayLocal } from '../../utils/dates'
import { Alert, Button, Card, ErrorState, Input, LoadingState, Select, useToast } from '../../components/ui'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]
const EMPTY_PW = { currentPassword: '', newPassword: '', confirm: '' }

/**
 * "My Profile" for every role: edit your own details and change your password.
 * Username and role are fixed; a doctor's department, specialization and fee are set by the administrator.
 */
export default function ProfilePage() {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [err, setErr] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [pw, setPw] = useState(EMPTY_PW)
  const [pwErr, setPwErr] = useState('')
  const [pwFieldErrors, setPwFieldErrors] = useState({})
  const [pwSaving, setPwSaving] = useState(false)

  function load() {
    setLoadError('')
    axiosInstance
      .get(ENDPOINTS.ME)
      .then(res => {
        setProfile(res.data)
        setForm(toForm(res.data))
      })
      .catch(e => setLoadError(errorMessage(e, 'Could not load your profile.')))
  }
  useEffect(load, [])

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const fe = name => fieldErrors[name]

  async function saveProfile(e) {
    e.preventDefault()
    setErr('')
    setFieldErrors({})
    setSaving(true)
    try {
      const res = await axiosInstance.put(ENDPOINTS.ME, form)
      setProfile(res.data)
      setForm(toForm(res.data))
      updateUser({ name: res.data.name })
      setEditing(false)
      toast.success('Your details have been saved.')
    } catch (e2) {
      setErr(errorMessage(e2, 'Could not save your details.'))
      setFieldErrors(e2?.response?.data?.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  const pwMismatch = pw.confirm && pw.newPassword !== pw.confirm ? 'The new passwords do not match.' : ''

  async function changePassword(e) {
    e.preventDefault()
    setPwErr('')
    setPwFieldErrors({})
    if (pwMismatch) return
    setPwSaving(true)
    try {
      await axiosInstance.put(ENDPOINTS.ME_PASSWORD, {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      setPw(EMPTY_PW)
      toast.success('Password changed. Use the new password next time you sign in.')
    } catch (e2) {
      setPwErr(errorMessage(e2, 'Could not change the password.'))
      setPwFieldErrors(e2?.response?.data?.fieldErrors || {})
    } finally {
      setPwSaving(false)
    }
  }

  if (loadError || !form) {
    return (
      <PageLayout>
        <PageTitle title="My Profile" />
        {loadError ? <ErrorState message={loadError} onRetry={load} /> : <LoadingState label="Loading your profile…" />}
      </PageLayout>
    )
  }

  const role = profile.role
  return (
    <PageLayout>
      <PageTitle
        title="My Profile"
        subtitle={`Signed in as ${profile.username} · ${role.replace(/_/g, ' ').toLowerCase()}`}
      />
      <div className="grid-2">
        {!editing ? (
          <Card
            title="Personal details"
            data-testid="profile-view"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm(toForm(profile))
                  setErr('')
                  setFieldErrors({})
                  setEditing(true)
                }}
              >
                Edit
              </Button>
            }
          >
            <dl className="divider-list">
              <Detail label="Full Name" value={profile.name} />
              <Detail label="Username" value={profile.username} />
              <Detail label="Email" value={profile.email} />
              <Detail label="Phone Number" value={profile.phoneNumber} />
              <Detail
                label="Gender"
                value={profile.gender && profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()}
              />
              <Detail label="Date of Birth" value={formatDob(profile.dateOfBirth)} />
              {role === 'PATIENT' && (
                <>
                  <Detail label="Blood Group" value={profile.bloodGroup} />
                  <Detail label="Emergency Contact" value={profile.emergencyContact} />
                  <Detail label="Allergies" value={profile.allergies} />
                  <Detail label="Chronic Conditions" value={profile.chronicConditions} />
                </>
              )}
              {role === 'DOCTOR' && (
                <>
                  <Detail label="Department" value={profile.departmentName} />
                  <Detail label="Specialization" value={profile.specialization} />
                  <Detail label="Qualification" value={profile.qualification} />
                  <Detail
                    label="Consultation Fee"
                    value={profile.consultationFee != null ? `₹${profile.consultationFee}` : null}
                  />
                </>
              )}
            </dl>
          </Card>
        ) : (
          <Card as="form" title="Edit personal details" onSubmit={saveProfile}>
            <Alert tone="error">{err}</Alert>
            <Input
              id="pf-name"
              label="Full Name"
              value={form.name}
              onChange={set('name')}
              required
              maxLength={100}
              error={fe('name')}
            />
            <Input
              id="pf-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              maxLength={100}
              error={fe('email')}
            />
            <div className="grid-form">
              <Select
                id="pf-gender"
                label="Gender"
                value={form.gender}
                onChange={set('gender')}
                required
                placeholder="Select"
                options={GENDERS}
                error={fe('gender')}
              />
              <Input
                id="pf-dob"
                label="Date of Birth"
                type="date"
                max={todayLocal()}
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
                required
                error={fe('dateOfBirth')}
              />
            </div>
            <Input
              id="pf-phone"
              label="Phone Number"
              value={form.phoneNumber}
              onChange={set('phoneNumber')}
              required
              maxLength={15}
              hint="7 to 15 digits"
              error={fe('phoneNumber')}
            />
            {role === 'PATIENT' && (
              <>
                <div className="grid-form">
                  <Select
                    id="pf-blood"
                    label="Blood Group"
                    value={form.bloodGroup}
                    onChange={set('bloodGroup')}
                    placeholder="Not known"
                    options={BLOOD_GROUPS}
                    error={fe('bloodGroup')}
                  />
                  <Input
                    id="pf-emerg"
                    label="Emergency Contact"
                    value={form.emergencyContact}
                    onChange={set('emergencyContact')}
                    maxLength={150}
                  />
                </div>
                <Input
                  id="pf-allergies"
                  label="Allergies"
                  value={form.allergies}
                  onChange={set('allergies')}
                  maxLength={2000}
                />
                <Input
                  id="pf-chronic"
                  label="Chronic Conditions"
                  value={form.chronicConditions}
                  onChange={set('chronicConditions')}
                  maxLength={2000}
                />
              </>
            )}
            {role === 'DOCTOR' && (
              <>
                <Input
                  id="pf-qual"
                  label="Qualification"
                  value={form.qualification}
                  onChange={set('qualification')}
                  maxLength={200}
                />
                <p className="muted text-sm mb-4">
                  Department: <strong>{profile.departmentName || '—'}</strong> · Specialization:{' '}
                  <strong>{profile.specialization || '—'}</strong> · Fee:{' '}
                  <strong>₹{profile.consultationFee ?? '—'}</strong>. Ask the administrator to change these.
                </p>
              </>
            )}
            <div className="row">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setForm(toForm(profile))
                  setErr('')
                  setFieldErrors({})
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <Card as="form" title="Change password" onSubmit={changePassword}>
          <Alert tone="error">{pwErr}</Alert>
          <Input
            id="pw-current"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
            required
            error={pwFieldErrors.currentPassword}
          />
          <Input
            id="pw-new"
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters"
            value={pw.newPassword}
            onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
            required
            error={pwFieldErrors.newPassword}
          />
          <Input
            id="pw-confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={pw.confirm}
            onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
            required
            error={pwMismatch}
          />
          <Button type="submit" variant="dark" loading={pwSaving} disabled={!!pwMismatch}>
            Change password
          </Button>
        </Card>
      </div>
    </PageLayout>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="muted text-xs">{label}</dt>
      <dd className="strong">{value || '—'}</dd>
    </div>
  )
}

function formatDob(d) {
  if (!d) return null
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toForm(p) {
  return {
    name: p.name || '',
    email: p.email || '',
    gender: p.gender || '',
    phoneNumber: p.phoneNumber || '',
    dateOfBirth: p.dateOfBirth || '',
    bloodGroup: p.bloodGroup || '',
    allergies: p.allergies || '',
    chronicConditions: p.chronicConditions || '',
    emergencyContact: p.emergencyContact || '',
    qualification: p.qualification || '',
  }
}
