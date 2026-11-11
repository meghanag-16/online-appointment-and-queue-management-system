import { useEffect, useState } from 'react'
import { getPublicDepartments } from '../../api/authApi'
import { todayLocal } from '../../utils/dates'
import { Alert, Button, Input, Select } from '../ui'

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
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'PATIENT',
  gender: '',
  phoneNumber: '',
  dateOfBirth: '',
  // patient
  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
  emergencyContact: '',
  // doctor
  departmentId: '',
  specialization: '',
  qualification: '',
  consultationFee: '',
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
      .then(res => {
        if (!cancelled) setDepartments(Array.isArray(res?.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setDeptError('Could not load departments.')
      })
    return () => {
      cancelled = true
    }
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

  const fe = name => fieldErrors[name]
  const ROLE_OPTIONS = roles.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))

  return (
    <form onSubmit={handleSubmit}>
      <Alert tone="error">{error}</Alert>

      <Input
        id="upf-name"
        label="Full Name"
        placeholder="Your full name"
        value={form.name}
        onChange={set('name')}
        required
        maxLength={100}
        error={fe('name')}
      />

      <div className="grid-form">
        <Input
          id="upf-username"
          label="Username"
          placeholder="username"
          value={form.username}
          onChange={set('username')}
          required
          minLength={3}
          maxLength={50}
          hint="Letters, digits, . _ -"
          error={fe('username')}
        />
        {!fixedRole && (
          <Select id="role-select" label="Role" value={form.role} onChange={set('role')} options={ROLE_OPTIONS} />
        )}
      </div>
      {roleNote && roleNote(role) && <Alert tone="info">{roleNote(role)}</Alert>}

      <Input
        id="upf-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={set('email')}
        required
        maxLength={100}
        error={fe('email')}
      />

      {showPassword && (
        <Input
          id="upf-password"
          label={passwordLabel}
          type="password"
          placeholder={passwordHint}
          hint={passwordHint}
          value={form.password}
          onChange={set('password')}
          required
          minLength={8}
          autoComplete="new-password"
          error={fe('password')}
        />
      )}

      <div className="grid-form">
        <Select
          id="gender-select"
          label="Gender"
          value={form.gender}
          onChange={set('gender')}
          required
          placeholder="Select Gender"
          options={[
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
            { value: 'OTHER', label: 'Other' },
          ]}
          error={fe('gender')}
        />
        <Input
          id="dob-input"
          label="Date of Birth"
          type="date"
          max={today}
          value={form.dateOfBirth}
          onChange={set('dateOfBirth')}
          required
          error={fe('dateOfBirth')}
        />
      </div>

      <Input
        id="phone-input"
        label="Phone Number"
        placeholder="Enter phone number"
        value={form.phoneNumber}
        onChange={set('phoneNumber')}
        required
        maxLength={15}
        hint="7 to 15 digits"
        error={fe('phoneNumber')}
      />

      {role === 'PATIENT' && (
        <fieldset className="fieldset">
          <legend>Medical details</legend>
          <div className="grid-form">
            <Select
              id="upf-blood"
              label="Blood Group"
              value={form.bloodGroup}
              onChange={set('bloodGroup')}
              placeholder="Not known"
              options={BLOOD_GROUPS}
              error={fe('bloodGroup')}
            />
            <Input
              id="upf-emergency"
              label="Emergency Contact"
              placeholder="Name and phone"
              value={form.emergencyContact}
              onChange={set('emergencyContact')}
              maxLength={150}
              error={fe('emergencyContact')}
            />
          </div>
          <Input
            id="upf-allergies"
            label="Allergies"
            placeholder="e.g. Penicillin (leave blank if none)"
            value={form.allergies}
            onChange={set('allergies')}
            maxLength={2000}
          />
          <Input
            id="upf-chronic"
            label="Chronic Conditions"
            placeholder="e.g. Diabetes (leave blank if none)"
            value={form.chronicConditions}
            onChange={set('chronicConditions')}
            maxLength={2000}
          />
        </fieldset>
      )}

      {role === 'DOCTOR' && (
        <fieldset className="fieldset">
          <legend>Professional details</legend>
          <Select
            id="upf-dept"
            label="Department"
            value={form.departmentId}
            onChange={set('departmentId')}
            required
            placeholder="Select Department"
            options={departments.map(d => ({ value: d.departmentId, label: d.departmentName }))}
            error={deptError || fe('departmentId')}
          />
          <div className="grid-form">
            <Input
              id="upf-spec"
              label="Specialization"
              placeholder="e.g. Cardiologist"
              value={form.specialization}
              onChange={set('specialization')}
              required
              maxLength={100}
              error={fe('specialization')}
            />
            <Input
              id="upf-fee"
              label="Consultation Fee (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 500"
              value={form.consultationFee}
              onChange={set('consultationFee')}
              required
              error={fe('consultationFee')}
            />
          </div>
          <Input
            id="upf-qual"
            label="Qualification"
            placeholder="e.g. MBBS, MD"
            value={form.qualification}
            onChange={set('qualification')}
            maxLength={200}
          />
        </fieldset>
      )}

      <Button type="submit" size="lg" block loading={loading} className="mt-2">
        {submitLabel}
      </Button>
    </form>
  )
}
