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
import { Alert, Button, Card, Textarea, useToast } from '../../components/ui'

/** Patient booking: pick a doctor → pick a slot → book. ?doctorId= preselects a doctor. */
export default function BookAppointment() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()

  const [doctor, setDoctor] = useState(null)
  const [slot, setSlot] = useState(null)
  const [reasonForVisit, setReasonForVisit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alternates, setAlternates] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [cutoff, setCutoff] = useState(null)

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.SLOT_SETTINGS)
      .then(res => setCutoff(res.data.changeCutoffHours))
      .catch(() => {})
    const preselected = params.get('doctorId')
    if (preselected) {
      axiosInstance
        .get(ENDPOINTS.DOCTORS_SEARCH())
        .then(res => {
          const d = res.data.find(x => x.userId === preselected)
          if (d) setDoctor(d)
        })
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function chooseDoctor(d) {
    setDoctor(d)
    setSlot(null)
    setError('')
    setAlternates([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!slot) {
      setError('Please select a time slot.')
      return
    }
    setLoading(true)
    setError('')
    setAlternates([])
    try {
      await axiosInstance.post(ENDPOINTS.APPOINTMENTS, {
        doctorId: doctor.userId,
        slotId: slot.slotId,
        reasonForVisit,
      })
      toast.success(`Booked with ${doctor.name} on ${formatSlot(slot.startTime)}.`)
      navigate('/patient/appointments')
    } catch (err) {
      setError(errorMessage(err, 'Booking failed. Please try again.'))
      setAlternates(err.response?.data?.alternateSlots || [])
      setSlot(null)
      setRefreshKey(k => k + 1) // reload the times: the one we chose is gone
    } finally {
      setLoading(false)
    }
  }

  function pickAlternate(alt) {
    if (alt.doctorId !== doctor?.userId) {
      setDoctor({ userId: alt.doctorId, name: alt.doctorName, departmentName: alt.departmentName })
    }
    setSlot({ slotId: alt.slotId, startTime: alt.startTime, endTime: alt.endTime })
    setAlternates([])
    setError('')
  }

  return (
    <PageLayout>
      <PageTitle title="Book Appointment" subtitle="Choose a doctor, then an open time" />

      <Card title="1. Choose a doctor" className="mb-6">
        <DoctorPicker selectedDoctorId={doctor?.userId} onSelect={chooseDoctor} />
      </Card>

      {doctor && (
        <Card
          as="form"
          onSubmit={handleSubmit}
          className="max-w-md"
          title={`2. Choose a time with ${doctor.name}`}
          subtitle={
            cutoff != null
              ? `You can cancel or reschedule up to ${cutoff} hour${cutoff === 1 ? '' : 's'} before the appointment.`
              : undefined
          }
        >
          <Alert tone="error">{error}</Alert>

          <SlotPicker
            doctorId={doctor.userId}
            selectedSlotId={slot?.slotId}
            onSelect={s => {
              setSlot(s)
              setError('')
            }}
            refreshKey={refreshKey}
          />
          <AlternateSlots alternates={alternates} onPick={pickAlternate} />

          <Textarea
            id="reason"
            label="Reason for visit"
            fieldClassName="mt-4"
            maxLength={2000}
            hint="Optional. Helps the doctor prepare."
            placeholder="Describe your symptoms or reason for visit…"
            value={reasonForVisit}
            onChange={e => setReasonForVisit(e.target.value)}
          />

          {slot && (
            <p className="mb-4">
              Selected: <strong>{formatSlot(slot.startTime)}</strong>
            </p>
          )}
          <Button type="submit" size="lg" block data-testid="book-btn" loading={loading} disabled={!slot}>
            Book Appointment
          </Button>
        </Card>
      )}
    </PageLayout>
  )
}
