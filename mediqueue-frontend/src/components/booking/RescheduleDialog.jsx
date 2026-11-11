import { useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { formatSlot } from '../../utils/dates'
import { Alert, Button, Modal } from '../ui'
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
    <Modal
      title="Reschedule appointment"
      subtitle={`${appointment.doctorName} · currently ${formatSlot(appointment.startTime)}`}
      onClose={onClose}
      testId="reschedule-dialog"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!slot} loading={saving} onClick={confirm} data-testid="confirm-reschedule">
            Confirm new time
          </Button>
        </>
      }
    >
      <Alert tone="error">{error}</Alert>
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
        <p className="mt-4">
          New time: <strong>{formatSlot(slot.startTime)}</strong>
        </p>
      )}
    </Modal>
  )
}
