import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import { getAdminDashboard } from '../../api/adminApi'
import { sendAlert, runReminders } from '../../api/notificationApi'
import { errorMessage } from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/formatters'

const ROLES = ['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMINISTRATOR']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [alert, setAlert] = useState({ role: 'PATIENT', message: '' })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    getAdminDashboard()
      .then(res => setStats(res.data))
      .catch(err => setError(errorMessage(err, 'Could not load the dashboard.')))
  }, [])

  async function submitAlert(e) {
    e.preventDefault()
    setNotice('')
    setError('')
    try {
      const res = await sendAlert({ role: alert.role, message: alert.message })
      setNotice(`Alert sent to ${res.data.sent} active ${alert.role.replace(/_/g, ' ').toLowerCase()} account(s).`)
      setAlert(a => ({ ...a, message: '' }))
    } catch (err) {
      setError(errorMessage(err, 'Could not send the alert.'))
    }
  }

  async function reminders() {
    setNotice('')
    setError('')
    try {
      const res = await runReminders()
      setNotice(`${res.data.sent} appointment reminder(s) sent for the next 24 hours.`)
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
    { label: "Today's appointments", value: v('todaysAppointments'), to: '/admin/queue' },
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
    },
  ]

  return (
    <PageLayout>
      <PageTitle title="Admin Dashboard" subtitle="System overview and management" />
      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {cards.map(c => {
          const body = (
            <div className="card card-hover" data-testid={`stat-${c.label}`} style={{ height: '100%' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{c.label}</p>
              <p style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--color-dark)', margin: 0 }}>{c.value}</p>
              {c.sub && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{c.sub}</p>
              )}
            </div>
          )
          return c.to ? (
            <Link key={c.label} to={c.to} style={{ textDecoration: 'none', color: 'inherit' }}>
              {body}
            </Link>
          ) : (
            <div key={c.label}>{body}</div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <form className="card" onSubmit={submitAlert}>
          <h3 style={{ marginBottom: 12 }}>Send a general alert</h3>
          <div className="form-group">
            <label htmlFor="al-role">To every active</label>
            <select
              id="al-role"
              className="form-control"
              value={alert.role}
              onChange={e => setAlert(a => ({ ...a, role: e.target.value }))}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="al-msg">Message</label>
            <textarea
              id="al-msg"
              className="form-control"
              rows={3}
              maxLength={1000}
              required
              value={alert.message}
              onChange={e => setAlert(a => ({ ...a, message: e.target.value }))}
              placeholder="e.g. The OPD will be closed on Sunday for maintenance."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send alert
          </button>
        </form>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Appointment reminders</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Patients get one reminder about 24 hours before each booked or confirmed appointment. The server checks
            every 5 minutes; use this to send any due reminders now.
          </p>
          <button type="button" className="btn btn-outline" onClick={reminders}>
            Send due reminders now
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
