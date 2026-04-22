import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'

function formatDateTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function BookAppointment() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [doctorId, setDoctorId]         = useState('')
  const [slots, setSlots]               = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError]     = useState('')

  const [appointmentDate, setAppointmentDate] = useState('')
  const [reasonForVisit, setReasonForVisit]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [alternates, setAlternates] = useState([])

  async function fetchSlots() {
    if (!doctorId.trim()) { setSlotsError('Please enter a Doctor ID first.'); return }
    setSlotsLoading(true); setSlotsError(''); setSlots([]); setSelectedSlot(null)
    try {
      const res = await axiosInstance.get(`/doctors/${doctorId.trim()}/slots`)
      if (res.data.length === 0) setSlotsError('No available slots for this doctor.')
      setSlots(res.data)
    } catch {
      setSlotsError('Could not fetch slots. Please check the Doctor ID.')
    } finally { setSlotsLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedSlot) { setError('Please select a time slot.'); return }
    setLoading(true); setError(''); setSuccess(''); setAlternates([])
    try {
      await axiosInstance.post(ENDPOINTS.APPOINTMENTS, {
        patientId: user.userId,
        doctorId: doctorId.trim(),
        slotId: selectedSlot.slotId,
        appointmentDate,
        reasonForVisit,
        priority: 'NORMAL',
        createdByRole: 'PATIENT',
      })
      setSuccess('Appointment booked successfully!')
      setTimeout(() => navigate('/patient/appointments'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.')
      if (err.response?.data?.alternateSlots) setAlternates(err.response.data.alternateSlots)
    } finally { setLoading(false) }
  }

  return (
    <PageLayout>
      <PageTitle title="Book Appointment" subtitle="Select a doctor and available time slot" />
      <div className="card" style={{ maxWidth: 560 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Doctor ID + Fetch Slots */}
          <div className="form-group">
            <label>Doctor ID</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-control" placeholder="Enter doctor ID (from Find Doctors)"
                value={doctorId} onChange={e => { setDoctorId(e.target.value); setSlots([]); setSelectedSlot(null) }}
                required style={{ flex: 1 }} />
              <button type="button" className="btn btn-primary"
                onClick={fetchSlots} disabled={slotsLoading}
                style={{ whiteSpace: 'nowrap' }}>
                {slotsLoading ? 'Loading…' : 'Get Slots'}
              </button>
            </div>
          </div>

          {slotsError && (
            <p style={{ color: 'var(--color-error, red)', fontSize: '0.85rem', marginBottom: 12 }}>
              {slotsError}
            </p>
          )}

          {/* Slot picker */}
          {slots.length > 0 && (
            <div className="form-group">
              <label>Available Time Slots</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slots.map(slot => {
                  const isSelected = selectedSlot?.slotId === slot.slotId
                  return (
                    <div key={slot.slotId}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border-tertiary, #ddd)'}`,
                        background: isSelected ? 'var(--color-accent-light, #fdf0f4)' : 'var(--color-bg-card, #fff)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        🕐 {formatDateTime(slot.startTime)} — {formatDateTime(slot.endTime)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Slot ID: {slot.slotId}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Appointment Date */}
          <div className="form-group">
            <label>Appointment Date</label>
            <input className="form-control" type="date"
              value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} required />
          </div>

          {/* Reason */}
          <div className="form-group">
            <label>Reason for Visit</label>
            <textarea className="form-control" rows={3}
              placeholder="Describe your symptoms or reason for visit…"
              value={reasonForVisit} onChange={e => setReasonForVisit(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading || !selectedSlot}>
            {loading ? 'Booking…' : 'Book Appointment'}
          </button>
        </form>

        {/* Alternate slots on failure */}
        {alternates.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 600, marginBottom: 12, color: 'var(--color-accent)' }}>
              Suggested Alternate Slots
            </p>
            {alternates.map(alt => (
              <div key={alt.slotId} className="card"
                style={{ marginBottom: 8, padding: '12px 16px', border: '1.5px solid var(--color-accent)',
                  cursor: 'pointer' }}
                onClick={() => {
                  setDoctorId(alt.doctorId)
                  setSelectedSlot({ slotId: alt.slotId, startTime: alt.startTime, endTime: alt.endTime })
                  setSlots([{ slotId: alt.slotId, startTime: alt.startTime, endTime: alt.endTime }])
                  setAlternates([])
                  setError('')
                }}>
                <p style={{ fontWeight: 500 }}>{alt.doctorName}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {alt.reason?.replace('_', ' ')}
                </p>
                <p style={{ fontSize: '0.82rem' }}>
                  🕐 {formatDateTime(alt.startTime)} — {formatDateTime(alt.endTime)}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Click to select this slot
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
