import { useEffect, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'

/**
 * Front desk: find a patient by name, username, phone, email or ID (no typing raw IDs).
 * Props: selected, onSelect(patient | null)
 */
export default function PatientPicker({ selected, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      axiosInstance
        .get(ENDPOINTS.PATIENT_SEARCH(query.trim()))
        .then(res => {
          setResults(res.data)
          setError('')
        })
        .catch(err => setError(errorMessage(err, 'Could not search patients.')))
    }, 250)
    return () => clearTimeout(t)
  }, [query, selected])

  if (selected) {
    return (
      <div style={chosen}>
        <div>
          <strong>{selected.name}</strong>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {selected.username} · {selected.phoneNumber || 'no phone'} · {selected.userId}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            onSelect(null)
            setQuery('')
          }}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div>
      <input
        className="form-control"
        aria-label="Find patient"
        placeholder="Patient name, phone, username or ID (min. 2 letters)"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {error && <small style={{ color: 'var(--color-danger)' }}>{error}</small>}
      {query.trim().length >= 2 && results.length === 0 && !error && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
          No matching patient. New patients register themselves on the sign-up page.
        </p>
      )}
      {results.length > 0 && (
        <div style={list}>
          {results.map(p => (
            <button key={p.userId} type="button" onClick={() => onSelect(p)} style={row}>
              <strong>{p.name}</strong>{' '}
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {p.username} · {p.phoneNumber} · {p.userId}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const chosen = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  border: '1.5px solid var(--color-accent)',
  borderRadius: 8,
  background: 'var(--color-accent-soft)',
}
const list = {
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  marginTop: 6,
  maxHeight: 220,
  overflowY: 'auto',
}
const row = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  border: 'none',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-white)',
  cursor: 'pointer',
}
