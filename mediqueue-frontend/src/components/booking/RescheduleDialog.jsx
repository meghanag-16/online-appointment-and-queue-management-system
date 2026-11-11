import { useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot } from '../../utils/dates'
import SlotPicker from './SlotPicker'
import AlternateSlots from './AlternateSlots'

/**
 * Move an appointment to another open slot with the same doctor.
 * Props: appointment, onClose(), onDone(updatedAppointment)
 */
export default function RescheduleDialog({ appointment, onClose, onDone }) {
  const [slot, setSlot] = useState(null)
  const [error, setError] = useState('')
  const [alternates, setAlternates] = useState([])
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  async function confirm() {
    if (!slot) return
    setSaving(true)
    setError('')
    setAlternates([])
    try {
      const res = await axiosInstance.patch(ENDPOINTS.RESCHEDULE_APPOINTMENT(appointment.appointmentId), {
        slotId: slot.slotId,
      })
      onDone(res.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not reschedule.'))
      setAlternates(err.response?.data?.alternateSlots || [])
      setSlot(null)
      setRefreshKey(k => k + 1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="reschedule-title" onClick={onClose}>
      <div className="card" style={panel} onClick={e => e.stopPropagation()}>
        <h3 id="reschedule-title" style={{ marginBottom: 4 }}>
          Reschedule appointment
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
          {appointment.doctorName} · currently {formatSlot(appointment.startTime)}
        </p>
        {error && <div className="alert alert-error">{error}</div>}

        <SlotPicker
          doctorId={appointment.doctorId}
          selectedSlotId={slot?.slotId}
          onSelect={setSlot}
          excludeSlotId={appointment.slotId}
          refreshKey={refreshKey}
        />
        <AlternateSlots
          alternates={alternates}
          onPick={alt => {
            setSlot(alt)
            setAlternates([])
            setError('')
          }}
        />

        {slot && (
          <p style={{ marginTop: 14, fontSize: '0.9rem' }}>
            New time: <strong>{formatSlot(slot.startTime)}</strong>
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" disabled={!slot || saving} onClick={confirm}>
            {saving ? 'Saving…' : 'Confirm new time'}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}
const panel = { width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }
