import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import DoctorPicker from '../../components/booking/DoctorPicker'
import SlotPicker from '../../components/booking/SlotPicker'
import AlternateSlots from '../../components/booking/AlternateSlots'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot } from '../../utils/dates'

/** Patient booking: pick a doctor → pick a slot → book. ?doctorId= preselects a doctor (from Find Doctors). */
export default function BookAppointment() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [doctor, setDoctor] = useState(null)
  const [slot, setSlot] = useState(null)
  const [reasonForVisit, setReasonForVisit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [alternates, setAlternates] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [cutoff, setCutoff] = useState(null)

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.SLOT_SETTINGS).then(res => setCutoff(res.data.changeCutoffHours)).catch(() => {})
    const preselected = params.get('doctorId')
    if (preselected) {
      axiosInstance.get(ENDPOINTS.DOCTORS_SEARCH()).then(res => {
        const d = res.data.find(x => x.userId === preselected)
        if (d) setDoctor(d)
      }).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function chooseDoctor(d) {
    setDoctor(d); setSlot(null); setError(''); setAlternates([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!slot) { setError('Please select a time slot.'); return }
    setLoading(true); setError(''); setSuccess(''); setAlternates([])
    try {
      await axiosInstance.post(ENDPOINTS.APPOINTMENTS, {
        doctorId: doctor.userId,
        slotId: slot.slotId,
        reasonForVisit,
      })
      setSuccess(`Booked with ${doctor.name} on ${formatSlot(slot.startTime)}.`)
      setTimeout(() => navigate('/patient/appointments'), 1500)
    } catch (err) {
      setError(errorMessage(err, 'Booking failed. Please try again.'))
      setAlternates(err.response?.data?.alternateSlots || [])
      setSlot(null)
      setRefreshKey(k => k + 1)   // reload the times: the one we chose is gone
    } finally { setLoading(false) }
  }

  function pickAlternate(alt) {
    if (alt.doctorId !== doctor?.userId) {
      setDoctor({ userId: alt.doctorId, name: alt.doctorName, departmentName: alt.departmentName })
    }
    setSlot({ slotId: alt.slotId, startTime: alt.startTime, endTime: alt.endTime })
    setAlternates([]); setError('')
  }

  return (
    <PageLayout>
      <PageTitle title="Book Appointment" subtitle="Choose a doctor, then an open time" />

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>1. Choose a doctor</h3>
        <DoctorPicker selectedDoctorId={doctor?.userId} onSelect={chooseDoctor} />
      </div>

      {doctor && (
        <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 760 }}>
          <h3 style={{ marginBottom: 4 }}>2. Choose a time with {doctor.name}</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
            {cutoff != null && `You can cancel or reschedule up to ${cutoff} hour${cutoff === 1 ? '' : 's'} before the appointment.`}
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <SlotPicker doctorId={doctor.userId} selectedSlotId={slot?.slotId} onSelect={s => { setSlot(s); setError('') }}
            refreshKey={refreshKey} />
          <AlternateSlots alternates={alternates} onPick={pickAlternate} />

          <div className="form-group" style={{ marginTop: 16 }}>
            <label htmlFor="reason">Reason for visit</label>
            <textarea id="reason" className="form-control" rows={3} maxLength={2000}
              placeholder="Describe your symptoms or reason for visit…"
              value={reasonForVisit} onChange={e => setReasonForVisit(e.target.value)} />
          </div>

          {slot && <p style={{ marginBottom: 12 }}>Selected: <strong>{formatSlot(slot.startTime)}</strong></p>}
          <button type="submit" className="btn btn-primary" data-testid="book-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading || !slot || !!success}>
            {loading ? 'Booking…' : 'Book Appointment'}
          </button>
        </form>
      )}
    </PageLayout>
  )
}
