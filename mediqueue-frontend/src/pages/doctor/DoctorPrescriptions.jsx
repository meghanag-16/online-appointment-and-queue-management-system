import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'

export default function DoctorPrescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [form, setForm] = useState({
    appointmentId: '', diagnosisNotes: '', medicationList: '', advice: '', followUpDate: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchPrescriptions() }, [])

  const fetchPrescriptions = async () => {
    try {
      const res = await axiosInstance.get(`/prescriptions/doctor/${user.userId}`)
      setPrescriptions(res.data)
    } catch { setPrescriptions([]) }
  }

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.appointmentId || !form.diagnosisNotes || !form.medicationList) {
      setError('Appointment ID, Diagnosis Notes, and Medications are required.'); return
    }
    setLoading(true); setError(''); setMessage('')
    try {
      await axiosInstance.post('/prescriptions', form)
      setMessage('Prescription created successfully!')
      setForm({ appointmentId: '', diagnosisNotes: '', medicationList: '', advice: '', followUpDate: '' })
      fetchPrescriptions()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create prescription.')
    } finally { setLoading(false) }
  }

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px',
    border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }

  return (
    <PageLayout>
      <PageTitle title="Prescriptions" subtitle="Create and view patient prescriptions" />
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {message && <p style={{ color: 'green', marginBottom: 12 }}>{message}</p>}
        {error   && <p style={{ color: 'red',   marginBottom: 12 }}>{error}</p>}

        {/* Create form */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Create New Prescription</h3>

          <input style={inputStyle} placeholder="Appointment ID *"
            value={form.appointmentId} onChange={set('appointmentId')} />

          <textarea style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Diagnosis Notes *" rows={3}
            value={form.diagnosisNotes} onChange={set('diagnosisNotes')} />

          <textarea style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Medications (e.g. Paracetamol 500mg twice daily) *" rows={3}
            value={form.medicationList} onChange={set('medicationList')} />

          <textarea style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Advice / Instructions (optional)" rows={2}
            value={form.advice} onChange={set('advice')} />

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
              Follow-up Date (optional)
            </label>
            <input type="date" value={form.followUpDate} onChange={set('followUpDate')}
              style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button onClick={handleSubmit} disabled={loading} style={{
              padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer',
              background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14
            }}>
              {loading ? 'Saving…' : 'Create Prescription'}
            </button>
          </div>
        </div>

        {/* Existing prescriptions */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Previous Prescriptions</h3>
          {prescriptions.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No prescriptions created yet.</p>
          ) : (
            prescriptions.map(p => (
              <div key={p.prescriptionId} style={{
                padding: '14px 0', borderBottom: '1px solid var(--color-border-tertiary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>{p.patientName}</strong>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Appointment #{p.appointmentId}
                  </span>
                </div>
                <p style={{ margin: '3px 0', fontSize: 13 }}>🩺 <strong>Diagnosis:</strong> {p.diagnosisNotes}</p>
                <p style={{ margin: '3px 0', fontSize: 13 }}>💊 <strong>Medications:</strong> {p.medicationList}</p>
                {p.advice && <p style={{ margin: '3px 0', fontSize: 13 }}>📋 <strong>Advice:</strong> {p.advice}</p>}
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Issued: {p.issuedAt ? new Date(p.issuedAt).toLocaleString('en-IN') : '—'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  )
}
