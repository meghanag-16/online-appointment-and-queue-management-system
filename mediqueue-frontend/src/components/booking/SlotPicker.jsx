import { useEffect, useMemo, useState } from 'react'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { datePart, formatDayLabel, formatTime } from '../../utils/dates'

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
  if (loading) return <p style={muted}>Loading available times…</p>
  if (error) return <div className="alert alert-error">{error}</div>
  if (days.length === 0) return <p style={muted}>This doctor has no open slots in the booking window.</p>

  return (
    <div data-testid="slot-picker">
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
        {days.map(d => (
          <button key={d} type="button" onClick={() => setDay(d)} style={chip(d === day)} aria-pressed={d === day}>
            <div style={{ fontWeight: 600 }}>{formatDayLabel(d)}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{byDay[d].length} open</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
        {(byDay[day] || []).map(s => (
          <button
            key={s.slotId}
            type="button"
            onClick={() => onSelect(s)}
            style={timeBtn(s.slotId === selectedSlotId)}
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

const muted = { color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '8px 0' }

const chip = active => ({
  flex: '0 0 auto',
  padding: '8px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
  background: active ? 'var(--color-accent)' : 'var(--color-white)',
  color: active ? '#fff' : 'var(--color-text)',
  textAlign: 'center',
  fontSize: '0.85rem',
})

const timeBtn = active => ({
  padding: '9px 6px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 600,
  border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
  background: active ? 'var(--color-accent-soft)' : 'var(--color-white)',
  color: active ? 'var(--color-accent)' : 'var(--color-text)',
})
