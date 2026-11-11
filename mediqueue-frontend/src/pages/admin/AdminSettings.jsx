import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { updateSlotSettings } from '../../api/adminApi'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

/** Administrator: slot length, working hours and days, booking window and the cancel/reschedule cutoff. */
export default function AdminSettings() {
  const [form, setForm] = useState(null)
  const [hasBreak, setHasBreak] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.SLOT_SETTINGS)
      .then(res => { setForm(res.data); setHasBreak(!!res.data.breakStart) })
      .catch(err => setError(errorMessage(err, 'Could not load settings.')))
  }, [])

  const set = (f, num = false) => e => setForm(s => ({ ...s, [f]: num ? Number(e.target.value) : e.target.value }))
  const toggleDay = d => setForm(s => ({
    ...s, workingDays: s.workingDays.includes(d) ? s.workingDays.filter(x => x !== d) : [...s.workingDays, d],
  }))

  async function save(e) {
    e.preventDefault()
    if (!window.confirm('Save? Open (unbooked) slots will be regenerated on the new schedule. Booked appointments keep their time.')) return
    setMessage(''); setError(''); setSaving(true)
    try {
      const payload = { ...form, breakStart: hasBreak ? form.breakStart : null, breakEnd: hasBreak ? form.breakEnd : null }
      const res = await updateSlotSettings(payload)
      setForm(res.data); setHasBreak(!!res.data.breakStart)
      setMessage('Settings saved and open slots regenerated.')
    } catch (err) {
      setError(errorMessage(err, 'Could not save settings.'))
    } finally { setSaving(false) }
  }

  if (!form) return <PageLayout>{error ? <div className="alert alert-error">{error}</div> : <Spinner />}</PageLayout>

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
  return (
    <PageLayout>
      <PageTitle title="Slot Settings" subtitle="How appointment slots are generated for every active doctor" />
      <form className="card" style={{ maxWidth: 620 }} onSubmit={save}>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div style={grid2}>
          <div className="form-group">
            <label htmlFor="s-len">Slot length (minutes)</label>
            <input id="s-len" type="number" min={10} max={240} step={5} className="form-control"
              value={form.slotMinutes} onChange={set('slotMinutes', true)} required />
          </div>
          <div className="form-group">
            <label htmlFor="s-window">Booking window (days ahead)</label>
            <input id="s-window" type="number" min={1} max={60} className="form-control"
              value={form.bookingWindowDays} onChange={set('bookingWindowDays', true)} required />
          </div>
        </div>
        <div style={grid2}>
          <div className="form-group">
            <label htmlFor="s-start">Day starts</label>
            <input id="s-start" type="time" className="form-control" value={form.dayStart} onChange={set('dayStart')} required />
          </div>
          <div className="form-group">
            <label htmlFor="s-end">Day ends</label>
            <input id="s-end" type="time" className="form-control" value={form.dayEnd} onChange={set('dayEnd')} required />
          </div>
        </div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input type="checkbox" checked={hasBreak} onChange={e => {
            setHasBreak(e.target.checked)
            if (e.target.checked && !form.breakStart) setForm(s => ({ ...s, breakStart: '13:00', breakEnd: '14:00' }))
          }} />
          Lunch break (no slots)
        </label>
        {hasBreak && (
          <div style={grid2}>
            <div className="form-group">
              <label htmlFor="s-bstart">Break starts</label>
              <input id="s-bstart" type="time" className="form-control" value={form.breakStart || ''} onChange={set('breakStart')} required />
            </div>
            <div className="form-group">
              <label htmlFor="s-bend">Break ends</label>
              <input id="s-bend" type="time" className="form-control" value={form.breakEnd || ''} onChange={set('breakEnd')} required />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Working days</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DAYS.map(d => (
              <label key={d} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.88rem' }}>
                <input type="checkbox" checked={form.workingDays.includes(d)} onChange={() => toggleDay(d)} />
                {d.slice(0, 3)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="s-cutoff">Patients can cancel/reschedule until (hours before the slot)</label>
          <input id="s-cutoff" type="number" min={0} max={72} className="form-control"
            value={form.changeCutoffHours} onChange={set('changeCutoffHours', true)} required />
          <small style={{ color: 'var(--color-text-muted)' }}>The front desk can still change appointments after this.</small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving || form.workingDays.length === 0}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </PageLayout>
  )
}
