import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { todayLocal } from '../../utils/dates'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/**
 * "My Profile" for every role: edit your own details and change your password.
 * Username and role are fixed; a doctor's department, specialization and fee are set by the administrator.
 */
export default function ProfilePage() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.ME)
      .then(res => {
        setProfile(res.data)
        setForm(toForm(res.data))
      })
      .catch(e => setLoadError(errorMessage(e, 'Could not load your profile.')))
  }, [])

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const fe = name =>
    fieldErrors[name] ? <small style={{ color: 'var(--color-danger)' }}>{fieldErrors[name]}</small> : null

  async function saveProfile(e) {
    e.preventDefault()
    setMsg('')
    setErr('')
    setFieldErrors({})
    setSaving(true)
    try {
      const res = await axiosInstance.put(ENDPOINTS.ME, form)
      setProfile(res.data)
      setForm(toForm(res.data))
      updateUser({ name: res.data.name })
      setEditing(false)
      setMsg('Your details have been saved.')
    } catch (e2) {
      setErr(errorMessage(e2, 'Could not save your details.'))
      setFieldErrors(e2?.response?.data?.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg('')
    setPwErr('')
    if (pw.newPassword !== pw.confirm) {
      setPwErr('The new passwords do not match.')
      return
    }
    setPwSaving(true)
    try {
      await axiosInstance.put(ENDPOINTS.ME_PASSWORD, {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      setPwMsg('Password changed. Use the new password next time you sign in.')
    } catch (e2) {
      setPwErr(errorMessage(e2, 'Could not change the password.'))
    } finally {
      setPwSaving(false)
    }
  }

  if (loadError)
    return (
      <PageLayout>
        <div className="alert alert-error">{loadError}</div>
      </PageLayout>
    )
  if (!form)
    return (
      <PageLayout>
        <Spinner />
      </PageLayout>
    )

  const role = profile.role
  return (
    <PageLayout>
      <PageTitle
        title="My Profile"
        subtitle={`Signed in as ${profile.username} · ${role.replace(/_/g, ' ').toLowerCase()}`}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {!editing ? (
          <div className="card" data-testid="profile-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Personal details</h3>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setForm(toForm(profile))
                  setMsg('')
                  setErr('')
                  setFieldErrors({})
                  setEditing(true)
                }}
              >
                Edit
              </button>
            </div>
            {msg && <div className="alert alert-success">{msg}</div>}
            <dl style={dl}>
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
          </div>
        ) : (
          <form className="card" onSubmit={saveProfile}>
            <h3 style={{ marginBottom: 16 }}>Edit personal details</h3>
            {err && <div className="alert alert-error">{err}</div>}

            <div className="form-group">
              <label htmlFor="pf-name">Full Name</label>
              <input
                id="pf-name"
                className="form-control"
                value={form.name}
                onChange={set('name')}
                required
                maxLength={100}
              />
              {fe('name')}
            </div>
            <div className="form-group">
              <label htmlFor="pf-email">Email</label>
              <input
                id="pf-email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={set('email')}
                required
                maxLength={100}
              />
              {fe('email')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="pf-gender">Gender</label>
                <select id="pf-gender" className="form-control" value={form.gender} onChange={set('gender')} required>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {fe('gender')}
              </div>
              <div className="form-group">
                <label htmlFor="pf-dob">Date of Birth</label>
                <input
                  id="pf-dob"
                  type="date"
                  className="form-control"
                  max={todayLocal()}
                  value={form.dateOfBirth}
                  onChange={set('dateOfBirth')}
                  required
                />
                {fe('dateOfBirth')}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="pf-phone">Phone Number</label>
              <input
                id="pf-phone"
                className="form-control"
                value={form.phoneNumber}
                onChange={set('phoneNumber')}
                required
                maxLength={15}
              />
              {fe('phoneNumber')}
            </div>

            {role === 'PATIENT' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label htmlFor="pf-blood">Blood Group</label>
                    <select id="pf-blood" className="form-control" value={form.bloodGroup} onChange={set('bloodGroup')}>
                      <option value="">Not known</option>
                      {BLOOD_GROUPS.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pf-emerg">Emergency Contact</label>
                    <input
                      id="pf-emerg"
                      className="form-control"
                      value={form.emergencyContact}
                      onChange={set('emergencyContact')}
                      maxLength={150}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="pf-allergies">Allergies</label>
                  <input
                    id="pf-allergies"
                    className="form-control"
                    value={form.allergies}
                    onChange={set('allergies')}
                    maxLength={2000}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pf-chronic">Chronic Conditions</label>
                  <input
                    id="pf-chronic"
                    className="form-control"
                    value={form.chronicConditions}
                    onChange={set('chronicConditions')}
                    maxLength={2000}
                  />
                </div>
              </>
            )}

            {role === 'DOCTOR' && (
              <>
                <div className="form-group">
                  <label htmlFor="pf-qual">Qualification</label>
                  <input
                    id="pf-qual"
                    className="form-control"
                    value={form.qualification}
                    onChange={set('qualification')}
                    maxLength={200}
                  />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  Department: <strong>{profile.departmentName || '—'}</strong> · Specialization:{' '}
                  <strong>{profile.specialization || '—'}</strong> · Fee:{' '}
                  <strong>₹{profile.consultationFee ?? '—'}</strong>. Ask the administrator to change these.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={() => {
                  setForm(toForm(profile))
                  setErr('')
                  setFieldErrors({})
                  setEditing(false)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <form className="card" onSubmit={changePassword}>
          <h3 style={{ marginBottom: 16 }}>Change password</h3>
          {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          <div className="form-group">
            <label htmlFor="pw-current">Current password</label>
            <input
              id="pw-current"
              type="password"
              className="form-control"
              autoComplete="current-password"
              value={pw.currentPassword}
              onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pw-new">New password</label>
            <input
              id="pw-new"
              type="password"
              className="form-control"
              autoComplete="new-password"
              minLength={8}
              placeholder="Min. 8 characters"
              value={pw.newPassword}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pw-confirm">Confirm new password</label>
            <input
              id="pw-confirm"
              type="password"
              className="form-control"
              autoComplete="new-password"
              minLength={8}
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-dark" disabled={pwSaving}>
            {pwSaving ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>
    </PageLayout>
  )
}

function Detail({ label, value }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <dt style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 500 }}>{value || '—'}</dd>
    </div>
  )
}

const dl = { margin: 0 }

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
