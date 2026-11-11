import { useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'

export default function PatientDoctorSearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError]       = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true); setSearched(true); setError('')
    try {
      const res = await axiosInstance.get(ENDPOINTS.DOCTORS_SEARCH(query))
      setResults(res.data)
    } catch (err) {
      // Show why it failed (e.g. backend not running) instead of pretending nothing matched.
      setResults([])
      setError(errorMessage(err, 'Search failed. Please try again.'))
    } finally { setLoading(false) }
  }

  return (
    <PageLayout>
      <PageTitle title="Find Doctors" subtitle="Search by name, specialization or department. Leave empty to list all doctors." />
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 28, maxWidth: 480 }}>
        <input className="form-control" placeholder="e.g. Cardiology, Dr. Mehta, pediatric…"
          value={query} onChange={e => setQuery(e.target.value)} />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading && <Spinner />}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && searched && !error && results.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No doctors found for "{query}".</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {results.map(doc => (
          <div key={doc.userId} className="card card-hover" style={{ cursor: 'default' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{doc.name}</p>
            <p style={{ color: 'var(--color-accent)', fontSize: '0.85rem', marginBottom: 6 }}>
              {doc.specialization}{doc.departmentName ? ` · ${doc.departmentName}` : ''}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{doc.qualification}</p>
            <p style={{ fontSize: '0.875rem' }}>Consultation Fee: <strong>₹{doc.consultationFee}</strong></p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>ID: {doc.userId}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
