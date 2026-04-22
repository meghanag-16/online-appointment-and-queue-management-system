import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PageTitle from '../../components/common/PageTitle'
import Spinner from '../../components/common/Spinner'
import StatusBadge from '../../components/common/StatusBadge'
import axiosInstance from '../../api/axiosInstance'

const STATUS_OPTIONS = ['BOOKED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW']

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterDate, setFilterDate]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterName, setFilterName]     = useState('')

  // Book-for-patient form
  const [showBook, setShowBook] = useState(false)
  const [doctors, setDoctors]   = useState([])
  const [slots, setSlots]       = useState([])
  const [bookForm, setBookForm] = useState({
    patientId: '', doctorId: '', slotId: '', appointmentDate: '', reasonForVisit: '', priority: 'NORMAL'
  })
  const [bookMsg, setBookMsg]   = useState('')
  const [bookErr, setBookErr]   = useState('')
  const [slotsLoading, setSL]   = useState(false)

  useEffect(() => { fetchAppointments(); fetchDoctors() }, [])

  async function fetchAppointments() {
    setLoading(true)
    try {
      const url = filterDate ? `/appointments/all?date=${filterDate}` : '/appointments/all'
      const res = await axiosInstance.get(url)
      setAppointments(res.data)
    } catch { setAppointments([]) }
    finally { setLoading(false) }
  }

  async function fetchDoctors() {
    try {
      const res = await axiosInstance.get('/doctors/search?q=')
      setDoctors(res.data)
    } catch { setDoctors([]) }
  }

  async function fetchSlots(doctorId) {
    if (!doctorId) return
    setSL(true); setSlots([])
    try {
      const res = await axiosInstance.get(`/doctors/${doctorId}/slots`)
      setSlots(res.data)
    } catch { setSlots([]) }
    finally { setSL(false) }
  }

  async function handleStatusChange(id, status) {
    try {
      await axiosInstance.patch(`/appointments/${id}/status`, { status })
      fetchAppointments()
    } catch {}
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await axiosInstance.patch(`/appointments/${id}/cancel`)
      fetchAppointments()
    } catch {}
  }

  async function handleBook() {
    if (!bookForm.patientId || !bookForm.doctorId || !bookForm.slotId || !bookForm.appointmentDate) {
      setBookErr('Patient ID, Doctor, Slot, and Date are required.'); return
    }
    setBookErr(''); setBookMsg('')
    try {
      await axiosInstance.post('/appointments', {
        ...bookForm,
        slotId: Number(bookForm.slotId),
        createdByRole: 'RECEPTIONIST'
      })
      setBookMsg('Appointment booked successfully!')
      setBookForm({ patientId: '', doctorId: '', slotId: '', appointmentDate: '', reasonForVisit: '', priority: 'NORMAL' })
      setSlots([])
      fetchAppointments()
    } catch (err) {
      setBookErr(err.response?.data?.error || 'Booking failed.')
    }
  }

  function formatTime(dt) {
    if (!dt) return '—'
    return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  // Filtered list
  const filtered = appointments.filter(a => {
    const matchStatus = !filterStatus || a.status === filterStatus
    const matchName   = !filterName   || 
      a.patientName?.toLowerCase().includes(filterName.toLowerCase()) ||
      a.doctorName?.toLowerCase().includes(filterName.toLowerCase())
    return matchStatus && matchName
  })

  const inputStyle = { padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, width: '100%', marginBottom: 10 }

  return (
    <PageLayout>
      <PageTitle title="Appointments" subtitle="View, manage and book appointments" />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Filter by Date</label>
          <input type="date" value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Filter by Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Search Name</label>
          <input placeholder="Patient or doctor name" value={filterName}
            onChange={e => setFilterName(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
        </div>
        <button className="btn btn-primary" onClick={fetchAppointments}
          style={{ padding: '8px 18px' }}>
          Refresh
        </button>
        <button onClick={() => { setShowBook(b => !b); setBookMsg(''); setBookErr('') }}
          style={{ padding: '8px 18px', background: showBook ? '#eee' : 'var(--color-dark)',
            color: showBook ? '#333' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          {showBook ? '✕ Close' : '+ Book for Patient'}
        </button>
      </div>

      {/* Book appointment form */}
      {showBook && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>Book Appointment for Patient</h3>
          {bookMsg && <p style={{ color: 'green', marginBottom: 10 }}>{bookMsg}</p>}
          {bookErr && <p style={{ color: 'red',   marginBottom: 10 }}>{bookErr}</p>}

          <input style={inputStyle} placeholder="Patient ID (e.g. USR-XXXXXXXX)"
            value={bookForm.patientId} onChange={e => setBookForm(p => ({...p, patientId: e.target.value}))} />

          <select style={inputStyle} value={bookForm.doctorId}
            onChange={e => {
              const did = e.target.value
              setBookForm(p => ({...p, doctorId: did, slotId: ''}))
              if (did) fetchSlots(did)
            }}>
            <option value="">Select Doctor</option>
            {doctors.map(d => (
              <option key={d.userId} value={d.userId}>{d.name} — {d.specialization}</option>
            ))}
          </select>

          {slotsLoading && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading slots…</p>}
          {slots.length > 0 && (
            <select style={inputStyle} value={bookForm.slotId}
              onChange={e => setBookForm(p => ({...p, slotId: e.target.value}))}>
              <option value="">Select Time Slot</option>
              {slots.map(s => (
                <option key={s.slotId} value={s.slotId}>
                  {new Date(s.startTime).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                  {' '}{formatTime(s.startTime)} – {formatTime(s.endTime)}
                </option>
              ))}
            </select>
          )}

          <input type="date" style={inputStyle} value={bookForm.appointmentDate}
            onChange={e => setBookForm(p => ({...p, appointmentDate: e.target.value}))} />

          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
            placeholder="Reason for visit"
            value={bookForm.reasonForVisit}
            onChange={e => setBookForm(p => ({...p, reasonForVisit: e.target.value}))} />

          <select style={inputStyle} value={bookForm.priority}
            onChange={e => setBookForm(p => ({...p, priority: e.target.value}))}>
            <option value="NORMAL">Normal Priority</option>
            <option value="HIGH_PRIORITY">High Priority</option>
          </select>

          <div style={{ textAlign: 'right' }}>
            <button onClick={handleBook}
              style={{ padding: '10px 20px', background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
              Book Appointment
            </button>
          </div>
        </div>
      )}

      {/* Appointments table */}
      {loading ? <Spinner /> : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border-tertiary)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>All Appointments</h3>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{filtered.length} records</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
                    No appointments found
                  </td></tr>
                )}
                {filtered.map(a => (
                  <tr key={a.appointmentId}>
                    <td style={{ fontSize: 11 }}>{a.appointmentId}</td>
                    <td>
                      <strong style={{ fontSize: 13 }}>{a.patientName}</strong>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.patientId}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.doctorName}</td>
                    <td style={{ fontSize: 13 }}>{a.appointmentDate || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {a.startTime ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}` : '—'}
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 120 }}>{a.reasonForVisit || '—'}</td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12,
                        background: a.priority === 'HIGH_PRIORITY' ? '#fde8ef' : '#f0f0f0',
                        color: a.priority === 'HIGH_PRIORITY' ? 'var(--color-accent)' : '#666' }}>
                        {a.priority?.replace('_', ' ') || 'NORMAL'}
                      </span>
                    </td>
                    <td>
                      <select value={a.status}
                        onChange={e => handleStatusChange(a.appointmentId, e.target.value)}
                        style={{ padding: '4px 6px', borderRadius: 5, border: '1px solid #ddd', fontSize: 12 }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                      </select>
                    </td>
                    <td>
                      {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                        <button onClick={() => handleCancel(a.appointmentId)}
                          style={{ padding: '4px 10px', fontSize: 12, background: '#fee', color: '#c0392b',
                            border: '1px solid #f5c6cb', borderRadius: 5, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
