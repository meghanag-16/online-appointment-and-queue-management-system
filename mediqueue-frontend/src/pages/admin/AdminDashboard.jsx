import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { getAdminDashboard } from '../../api/adminApi'
import { sendAlert, runReminders } from '../../api/notificationApi'
import { errorMessage } from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/formatters'
import { Alert, Button, Card, ErrorState, Select, StatCard, Textarea, useToast } from '../../components/ui'

const ROLES = ['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMINISTRATOR']

export default function AdminDashboard() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [alert, setAlert] = useState({ role: 'PATIENT', message: '' })
  const [sending, setSending] = useState(false)

  function load() {
    getAdminDashboard()
      .then(res => {
        setStats(res.data)
        setLoadError('')
      })
      .catch(err => setLoadError(errorMessage(err, 'Could not load the dashboard.')))
  }
  useEffect(load, [])

  async function submitAlert(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const res = await sendAlert({ role: alert.role, message: alert.message.trim() })
      toast.success(`Alert sent to ${res.data.sent} active ${alert.role.replace(/_/g, ' ').toLowerCase()} account(s).`)
      setAlert(a => ({ ...a, message: '' }))
    } catch (err) {
      setError(errorMessage(err, 'Could not send the alert.'))
    } finally {
      setSending(false)
    }
  }

  async function reminders() {
    setError('')
    try {
      const res = await runReminders()
      toast.success(`${res.data.sent} appointment reminder(s) sent for the next 24 hours.`)
    } catch (err) {
      setError(errorMessage(err, 'Could not run reminders.'))
    }
  }

  const v = k => (stats ? (stats[k] ?? 0) : '—')
  const cards = [
    {
      label: 'Active users',
      value: v('activeUsers'),
      sub: stats ? `${stats.totalUsers} accounts, ${stats.inactiveUsers} suspended/deactivated` : '',
      to: '/admin/users',
    },
    { label: 'Active patients', value: v('activePatients'), to: '/admin/users' },
    { label: 'Active doctors', value: v('totalDoctors'), to: '/admin/doctors' },
    { label: "Today's appointments", value: v('todaysAppointments'), to: '/admin/queue', tone: 'accent' },
    { label: 'Upcoming appointments', value: v('activeAppointments'), sub: 'booked, confirmed or in progress' },
    { label: 'Open complaints', value: v('openComplaints'), sub: 'open or under review', to: '/admin/complaints' },
    {
      label: 'Unpaid bills',
      value: v('unpaidBills'),
      sub: stats ? formatCurrency(stats.unpaidAmount) + ' outstanding' : '',
      to: '/admin/billing',
    },
    {
      label: 'Collected',
      value: stats ? formatCurrency(stats.collectedAmount) : '—',
      sub: 'paid bills',
      to: '/admin/billing',
      tone: 'success',
    },
  ]

  return (
    <PageLayout>
      <PageTitle title="Admin Dashboard" subtitle="System overview and management" />
      <ErrorState message={loadError} onRetry={load} />
      <div className="grid-auto mb-6">
        {cards.map(c => (
          <StatCard key={c.label} {...c} testId={`stat-${c.label}`} />
        ))}
      </div>

      <Alert tone="error">{error}</Alert>
      <div className="grid-2">
        <Card title="Send a general alert" as="form" onSubmit={submitAlert}>
          <Select
            id="al-role"
            label="To every active"
            value={alert.role}
            onChange={e => setAlert(a => ({ ...a, role: e.target.value }))}
            options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ').toLowerCase() }))}
          />
          <Textarea
            id="al-msg"
            label="Message"
            maxLength={1000}
            required
            hint={`${alert.message.length}/1000`}
            value={alert.message}
            onChange={e => setAlert(a => ({ ...a, message: e.target.value }))}
            placeholder="e.g. The OPD will be closed on Sunday for maintenance."
          />
          <Button type="submit" loading={sending} disabled={!alert.message.trim()}>
            Send alert
          </Button>
        </Card>
        <Card title="Appointment reminders">
          <p className="muted mb-4">
            Patients get one reminder about 24 hours before each booked or confirmed appointment. The server checks
            every 5 minutes; use this to send any due reminders now.
          </p>
          <Button variant="outline" onClick={reminders}>
            Send due reminders now
          </Button>
        </Card>
      </div>
    </PageLayout>
  )
}
