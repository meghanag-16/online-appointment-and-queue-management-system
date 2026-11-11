import { useEffect, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot, todayLocal } from '../../utils/dates'

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
    axiosInstance.get(ENDPOINTS.DEPARTMENTS).then(res => setDepartments(res.data)).catch(() => setDepartments([]))
  }, [])

  // Search as the filters change (short debounce for typing).
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true); setError('')
      axiosInstance.get(ENDPOINTS.DOCTORS_SEARCH(query.trim(), departmentId, date))
        .then(res => setDoctors(res.data))
        .catch(err => { setDoctors([]); setError(errorMessage(err, 'Could not search doctors.')) })
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query, departmentId, date])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
        <select className="form-control" aria-label="Department" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
        </select>
        <input className="form-control" aria-label="Doctor name or specialization" placeholder="Name or specialization"
          value={query} onChange={e => setQuery(e.target.value)} />
        <input className="form-control" type="date" aria-label="Available on" title="Only doctors with open slots on this day"
          min={todayLocal()} value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={muted}>Searching…</p>}
      {!loading && !error && doctors.length === 0 && <p style={muted}>No doctors match these filters.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 200 : 240}px, 1fr))`, gap: 10,
        maxHeight: compact ? 260 : 'none', overflowY: compact ? 'auto' : 'visible' }}>
        {doctors.map(doc => {
          const active = doc.userId === selectedDoctorId
          return (
            <button key={doc.userId} type="button" onClick={() => onSelect(doc)} aria-pressed={active}
              data-testid={`doctor-${doc.userId}`} style={card(active)}>
              <div style={{ fontWeight: 600 }}>{doc.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', margin: '2px 0' }}>
                {doc.specialization}{doc.departmentName ? ` · ${doc.departmentName}` : ''}
              </div>
              {!compact && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{doc.qualification}</div>}
              <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                ₹{doc.consultationFee} · {doc.nextAvailableSlot ? `next: ${formatSlot(doc.nextAvailableSlot)}` : 'no open slots'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const muted = { color: 'var(--color-text-muted)', fontSize: '0.88rem' }
const card = (active) => ({
  textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', color: 'var(--color-text)',
  border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
  background: active ? 'var(--color-accent-soft)' : 'var(--color-white)',
})
