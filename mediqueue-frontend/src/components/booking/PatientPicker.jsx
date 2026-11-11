import { useEffect, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import Button from '../ui/Button'

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
      <div className="picked" data-testid="picked-patient">
        <div>
          <strong>{selected.name}</strong>
          <span className="cell-sub">
            {selected.username} · {selected.phoneNumber || 'no phone'} · {selected.userId}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSelect(null)
            setQuery('')
          }}
        >
          Change
        </Button>
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
        data-testid="patient-search"
      />
      {error && <small className="form-error">{error}</small>}
      {query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="form-hint mt-2">No matching patient. New patients register themselves on the sign-up page.</p>
      )}
      {results.length > 0 && (
        <div className="result-list">
          {results.map(p => (
            <button
              key={p.userId}
              type="button"
              className="result-item"
              onClick={() => onSelect(p)}
              data-testid={`patient-${p.userId}`}
            >
              <strong>{p.name}</strong>{' '}
              <span className="muted text-xs">
                {p.username} · {p.phoneNumber} · {p.userId}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
