import { useEffect, useState } from 'react'
import { getPublicDepartments } from '../../api/authApi'
import { todayLocal } from '../../utils/dates'

/**
 * The ONE user form, shared by public patient sign-up (RegisterPage) and administrator user
 * creation (AdminUsers, AdminDoctors). Only administrators can create non-patient accounts. It collects exactly the fields of the backend RegisterRequest,
 * so a user created either way ends up with the same data for their role.
 *
 * Props:
 *  - roles:        roles offered in the Role dropdown
 *  - fixedRole:    if set, the role is locked to this value (no dropdown)
 *  - submitLabel:  button text
 *  - passwordLabel / passwordHint: wording for the password field
 *  - roleNote:     (role) => optional note shown under the role selector
 *  - onSubmit:     async (payload) => void; throw to show the server's error
 *  - resetOnSuccess: clear the form after a successful submit
 *  - showPassword: false for administrator forms (the server generates a temporary password)
 */
export const ALL_ROLES = ['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMINISTRATOR']

const EMPTY = {
  name: '', username: '', email: '', password: '', role: 'PATIENT',
  gender: '', phoneNumber: '', dateOfBirth: '',
  // patient
  bloodGroup: '', allergies: '', chronicConditions: '', emergencyContact: '',
  // doctor
  departmentId: '', specialization: '', qualification: '', consultationFee: '',
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/** Only the fields that belong to the chosen role are sent. */
export function buildUserPayload(form) {
  const payload = {
    name: form.name.trim(),
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
    role: form.role,
    gender: form.gender,
    phoneNumber: form.phoneNumber.trim(),
    dateOfBirth: form.dateOfBirth,
  }
  if (form.role === 'PATIENT') {
    Object.assign(payload, {
      bloodGroup: form.bloodGroup,
      allergies: form.allergies,
      chronicConditions: form.chronicConditions,
      emergencyContact: form.emergencyContact,
    })
  }
  if (form.role === 'DOCTOR') {
    Object.assign(payload, {
      departmentId: form.departmentId,
      specialization: form.specialization,
      qualification: form.qualification,
      consultationFee: form.consultationFee === '' ? null : Number(form.consultationFee),
    })
  }
  return payload
}

export default function UserProfileForm({
  roles = ALL_ROLES,
  fixedRole,
  submitLabel = 'Save',
  passwordLabel = 'Password',
  passwordHint = 'Min. 8 characters',
  roleNote,
  onSubmit,
  resetOnSuccess = false,
  showPassword = true,
}) {
  const [form, setForm] = useState({ ...EMPTY, role: fixedRole || roles[0] || 'PATIENT' })
  const [departments, setDepartments] = useState([])
  const [deptError, setDeptError] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const role = fixedRole || form.role
  const today = todayLocal()

  // Departments are only needed (and only fetched) for doctors.
  useEffect(() => {
    if (role !== 'DOCTOR' || departments.length > 0) return
    let cancelled = false
    getPublicDepartments()
      .then(res => { if (!cancelled) setDepartments(Array.isArray(res?.data) ? res.data : []) })
      .catch(() => { if (!cancelled) setDeptError('Could not load departments.') })
    return () => { cancelled = true }
  }, [role, departments.length])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const payload = buildUserPayload({ ...form, role })
      if (!showPassword) delete payload.password
      await onSubmit(payload)
      if (resetOnSuccess) setForm({ ...EMPTY, role: fixedRole || roles[0] || 'PATIENT' })
    } catch (err) {
      setError(err?.response?.data?.error || err?.userMessage || 'Could not save. Please try again.')
      setFieldErrors(err?.response?.data?.fieldErrors || {})
    } finally {
      setLoading(false)
    }
  }

  const fe = (name) => fieldErrors[name]
    ? <small style={{ color: 'var(--color-danger)' }}>{fieldErrors[name]}</small>
    : null

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="upf-name">Full Name</label>
        <input id="upf-name" className="form-control" placeholder="Your full name"
          value={form.name} onChange={set('name')} required maxLength={100} />
        {fe('name')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: fixedRole ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label htmlFor="upf-username">Username</label>
          <input id="upf-username" className="form-control" placeholder="username"
            value={form.username} onChange={set('username')} required minLength={3} maxLength={50} />
          {fe('username')}
        </div>
        {!fixedRole && (
          <div className="form-group">
            <label htmlFor="role-select">Role</label>
            <select id="role-select" className="form-control" value={form.role} onChange={set('role')}>
              {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        )}
      </div>
      {roleNote && roleNote(role) && (
        <div className="alert alert-info" style={{ marginTop: -4 }}>{roleNote(role)}</div>
      )}

      <div className="form-group">
        <label htmlFor="upf-email">Email</label>
        <input id="upf-email" className="form-control" type="email" placeholder="you@example.com"
          value={form.email} onChange={set('email')} required maxLength={100} />
        {fe('email')}
      </div>

      {showPassword && <div className="form-group">
        <label htmlFor="upf-password">{passwordLabel}</label>
        <input id="upf-password" className="form-control" type="password" placeholder={passwordHint}
          value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
        {fe('password')}
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label htmlFor="gender-select">Gender</label>
          <select id="gender-select" className="form-control" value={form.gender} onChange={set('gender')} required>
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {fe('gender')}
        </div>
        <div className="form-group">
          <label htmlFor="dob-input">Date of Birth</label>
          <input id="dob-input" className="form-control" type="date" max={today}
            value={form.dateOfBirth} onChange={set('dateOfBirth')} required />
          {fe('dateOfBirth')}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="phone-input">Phone Number</label>
        <input id="phone-input" className="form-control" placeholder="Enter phone number"
          value={form.phoneNumber} onChange={set('phoneNumber')} required maxLength={15} />
        {fe('phoneNumber')}
      </div>

      {role === 'PATIENT' && (
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Medical details</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="upf-blood">Blood Group</label>
              <select id="upf-blood" className="form-control" value={form.bloodGroup} onChange={set('bloodGroup')}>
                <option value="">Not known</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {fe('bloodGroup')}
            </div>
            <div className="form-group">
              <label htmlFor="upf-emergency">Emergency Contact</label>
              <input id="upf-emergency" className="form-control" placeholder="Name and phone"
                value={form.emergencyContact} onChange={set('emergencyContact')} maxLength={150} />
              {fe('emergencyContact')}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="upf-allergies">Allergies</label>
            <input id="upf-allergies" className="form-control" placeholder="e.g. Penicillin (leave blank if none)"
              value={form.allergies} onChange={set('allergies')} maxLength={2000} />
          </div>
          <div className="form-group">
            <label htmlFor="upf-chronic">Chronic Conditions</label>
            <input id="upf-chronic" className="form-control" placeholder="e.g. Diabetes (leave blank if none)"
              value={form.chronicConditions} onChange={set('chronicConditions')} maxLength={2000} />
          </div>
        </fieldset>
      )}

      {role === 'DOCTOR' && (
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Professional details</legend>
          <div className="form-group">
            <label htmlFor="upf-dept">Department</label>
            <select id="upf-dept" className="form-control" value={form.departmentId} onChange={set('departmentId')} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
            {deptError && <small style={{ color: 'var(--color-danger)' }}>{deptError}</small>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="upf-spec">Specialization</label>
              <input id="upf-spec" className="form-control" placeholder="e.g. Cardiologist"
                value={form.specialization} onChange={set('specialization')} required maxLength={100} />
            </div>
            <div className="form-group">
              <label htmlFor="upf-fee">Consultation Fee (₹)</label>
              <input id="upf-fee" className="form-control" type="number" min="0" step="0.01" placeholder="e.g. 500"
                value={form.consultationFee} onChange={set('consultationFee')} required />
              {fe('consultationFee')}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="upf-qual">Qualification</label>
            <input id="upf-qual" className="form-control" placeholder="e.g. MBBS, MD"
              value={form.qualification} onChange={set('qualification')} maxLength={200} />
          </div>
        </fieldset>
      )}

      <button type="submit" className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}
        disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}

const fieldsetStyle = {
  border: '1px solid var(--color-border)', borderRadius: 8,
  padding: '12px 16px 4px', margin: '4px 0 16px',
}
const legendStyle = { padding: '0 6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }
