import { useEffect, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot, todayLocal } from '../../utils/dates'
import { EmptyState, ErrorState, LoadingState } from '../ui'

/**
 * Find a doctor by department, name/specialization and (optionally) a day they have open slots,
 * then pick one. No typing of doctor IDs.
 *
 * Props: selectedDoctorId, onSelect(doctor), compact (smaller cards, for the front desk form)
 */
export default function DoctorPicker({ selectedDoctorId, onSelect, compact = false }) {
  const [departments, setDepartments] = useState([])
  const [departmentId, setDepartmentId] = useState('')
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.DEPARTMENTS)
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]))
  }, [])

  // Search as the filters change (short debounce for typing).
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      setError('')
      axiosInstance
        .get(ENDPOINTS.DOCTORS_SEARCH(query.trim(), departmentId, date))
        .then(res => setDoctors(res.data))
        .catch(err => {
          setDoctors([])
          setError(errorMessage(err, 'Could not search doctors.'))
        })
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query, departmentId, date])

  return (
    <div>
      <div className="grid-form">
        <select
          className="form-control mb-4"
          aria-label="Department"
          value={departmentId}
          onChange={e => setDepartmentId(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map(d => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.departmentName}
            </option>
          ))}
        </select>
        <input
          className="form-control mb-4"
          aria-label="Doctor name or specialization"
          placeholder="Name or specialization"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <input
          className="form-control mb-4"
          type="date"
          aria-label="Available on"
          title="Only doctors with open slots on this day"
          min={todayLocal()}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <ErrorState message={error} />
      {loading && <LoadingState label="Searching doctors…" />}
      {!loading && !error && doctors.length === 0 && (
        <EmptyState icon="🩺" title="No doctors match these filters" description="Try another department or day." />
      )}

      {!loading && (
        <div className={`choice-grid ${compact ? 'is-compact' : ''}`.trim()}>
          {doctors.map(doc => (
            <button
              key={doc.userId}
              type="button"
              className="choice"
              onClick={() => onSelect(doc)}
              aria-pressed={doc.userId === selectedDoctorId}
              data-testid={`doctor-${doc.userId}`}
            >
              <span className="choice-title block">{doc.name}</span>
              <span className="choice-meta block">
                {doc.specialization}
                {doc.departmentName ? ` · ${doc.departmentName}` : ''}
              </span>
              {!compact && <span className="choice-sub block">{doc.qualification}</span>}
              <span className="choice-sub block">
                ₹{doc.consultationFee} ·{' '}
                {doc.nextAvailableSlot ? `next: ${formatSlot(doc.nextAvailableSlot)}` : 'no open slots'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
