import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import axiosInstance, { errorMessage } from '../../api/axiosInstance'
import { ENDPOINTS } from '../../api/endpoints'
import { updateSlotSettings } from '../../api/adminApi'
import { Alert, Button, Card, ErrorState, Input, LoadingState, useConfirm, useToast } from '../../components/ui'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

/** Administrator: slot length, working hours and days, booking window and the cancel/reschedule cutoff. */
export default function AdminSettings() {
  const confirm = useConfirm()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [hasBreak, setHasBreak] = useState(true)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.SLOT_SETTINGS)
      .then(res => {
        setForm(res.data)
        setHasBreak(!!res.data.breakStart)
      })
      .catch(err => setError(errorMessage(err, 'Could not load settings.')))
  }, [])

  const set =
    (f, num = false) =>
    e =>
      setForm(s => ({ ...s, [f]: num ? Number(e.target.value) : e.target.value }))
  const toggleDay = d =>
    setForm(s => ({
      ...s,
      workingDays: s.workingDays.includes(d) ? s.workingDays.filter(x => x !== d) : [...s.workingDays, d],
    }))

  async function save(e) {
    e.preventDefault()
    const ok = await confirm({
      title: 'Save slot settings?',
      message: 'Open (unbooked) slots will be regenerated on the new schedule. Booked appointments keep their time.',
      confirmLabel: 'Save settings',
    })
    if (!ok) return
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      const payload = {
        ...form,
        breakStart: hasBreak ? form.breakStart : null,
        breakEnd: hasBreak ? form.breakEnd : null,
      }
      const res = await updateSlotSettings(payload)
      setForm(res.data)
      setHasBreak(!!res.data.breakStart)
      toast.success('Settings saved and open slots regenerated.')
    } catch (err) {
      setError(errorMessage(err, 'Could not save settings.'))
      setFieldErrors(err.response?.data?.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <PageLayout>
        <PageTitle title="Slot Settings" />
        {error ? <ErrorState message={error} /> : <LoadingState label="Loading settings…" />}
      </PageLayout>
    )
  }

  const timeError = form.dayStart && form.dayEnd && form.dayEnd <= form.dayStart ? 'Must be after the start' : ''
  const breakError =
    hasBreak && form.breakStart && form.breakEnd && form.breakEnd <= form.breakStart
      ? 'Must be after the break start'
      : ''

  return (
    <PageLayout>
      <PageTitle title="Slot Settings" subtitle="How appointment slots are generated for every active doctor" />
      <Card className="max-w-md">
        <form onSubmit={save}>
          <Alert tone="error">{error}</Alert>
          <div className="grid-form">
            <Input
              id="s-len"
              label="Slot length (minutes)"
              type="number"
              min={10}
              max={240}
              step={5}
              value={form.slotMinutes}
              onChange={set('slotMinutes', true)}
              required
              error={fieldErrors.slotMinutes}
            />
            <Input
              id="s-window"
              label="Booking window (days ahead)"
              type="number"
              min={1}
              max={60}
              value={form.bookingWindowDays}
              onChange={set('bookingWindowDays', true)}
              required
              error={fieldErrors.bookingWindowDays}
            />
            <Input
              id="s-start"
              label="Day starts"
              type="time"
              value={form.dayStart}
              onChange={set('dayStart')}
              required
            />
            <Input
              id="s-end"
              label="Day ends"
              type="time"
              value={form.dayEnd}
              onChange={set('dayEnd')}
              required
              error={timeError}
            />
          </div>

          <label className="checkbox-label mb-4">
            <input
              type="checkbox"
              checked={hasBreak}
              onChange={e => {
                setHasBreak(e.target.checked)
                if (e.target.checked && !form.breakStart)
                  setForm(s => ({ ...s, breakStart: '13:00', breakEnd: '14:00' }))
              }}
            />
            Lunch break (no slots)
          </label>
          {hasBreak && (
            <div className="grid-form">
              <Input
                id="s-bstart"
                label="Break starts"
                type="time"
                value={form.breakStart || ''}
                onChange={set('breakStart')}
                required
              />
              <Input
                id="s-bend"
                label="Break ends"
                type="time"
                value={form.breakEnd || ''}
                onChange={set('breakEnd')}
                required
                error={breakError}
              />
            </div>
          )}

          <div className="form-group">
            <span className="form-label" id="s-days">
              Working days
            </span>
            <div role="group" aria-labelledby="s-days" className="row">
              {DAYS.map(d => (
                <label key={d} className="checkbox-label">
                  <input type="checkbox" checked={form.workingDays.includes(d)} onChange={() => toggleDay(d)} />
                  {d.slice(0, 3)}
                </label>
              ))}
            </div>
            {form.workingDays.length === 0 && <small className="form-error">Pick at least one working day</small>}
          </div>

          <Input
            id="s-cutoff"
            label="Patients can cancel/reschedule until (hours before the slot)"
            type="number"
            min={0}
            max={72}
            value={form.changeCutoffHours}
            onChange={set('changeCutoffHours', true)}
            required
            hint="The front desk can still change appointments after this."
            error={fieldErrors.changeCutoffHours}
          />

          <Button
            type="submit"
            loading={saving}
            disabled={form.workingDays.length === 0 || !!timeError || !!breakError}
          >
            Save settings
          </Button>
        </form>
      </Card>
    </PageLayout>
  )
}
