import { useEffect, useMemo, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { datePart, formatDayLabel, formatTime } from '../../utils/dates'
import { EmptyState, ErrorState, LoadingState } from '../ui'

/**
 * Pick an open slot of one doctor: a row of day chips, then the times on that day.
 * The appointment date always comes from the chosen slot (there is no separate date box).
 *
 * Props: doctorId, selectedSlotId, onSelect(slot), excludeSlotId (e.g. the current slot when
 * rescheduling), refreshKey (change it to reload after a failed booking).
 */
export default function SlotPicker({ doctorId, selectedSlotId, onSelect, excludeSlotId, refreshKey = 0 }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [day, setDay] = useState('')

  useEffect(() => {
    if (!doctorId) {
      setSlots([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    axiosInstance
      .get(ENDPOINTS.DOCTOR_SLOTS(doctorId))
      .then(res => {
        if (!cancelled) setSlots(res.data.filter(s => s.slotId !== excludeSlotId))
      })
      .catch(err => {
        if (!cancelled) {
          setSlots([])
          setError(errorMessage(err, 'Could not load time slots.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [doctorId, excludeSlotId, refreshKey])

  const byDay = useMemo(() => {
    const groups = {}
    for (const s of slots) (groups[datePart(s.startTime)] ||= []).push(s)
    return groups
  }, [slots])
  const days = Object.keys(byDay).sort()

  // Keep the selected day valid: the selected slot's day, else the first day with slots.
  useEffect(() => {
    const selected = slots.find(s => s.slotId === selectedSlotId)
    if (selected) setDay(datePart(selected.startTime))
    else if (!days.includes(day)) setDay(days[0] || '')
  }, [slots, selectedSlotId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!doctorId) return null
  if (loading) return <LoadingState label="Loading available times…" />
  if (error) return <ErrorState message={error} />
  if (days.length === 0) {
    return (
      <EmptyState icon="🗓️" title="No open slots" description="This doctor has no free time in the booking window." />
    )
  }

  return (
    <div data-testid="slot-picker">
      <div className="chip-row">
        {days.map(d => (
          <button key={d} type="button" className="chip" onClick={() => setDay(d)} aria-pressed={d === day}>
            <span className="strong block">{formatDayLabel(d)}</span>
            <span className="text-xs block">{byDay[d].length} open</span>
          </button>
        ))}
      </div>
      <div className="time-grid">
        {(byDay[day] || []).map(s => (
          <button
            key={s.slotId}
            type="button"
            className="time-btn"
            onClick={() => onSelect(s)}
            aria-pressed={s.slotId === selectedSlotId}
            data-testid={`slot-${s.slotId}`}
          >
            {formatTime(s.startTime)}
          </button>
        ))}
      </div>
    </div>
  )
}
