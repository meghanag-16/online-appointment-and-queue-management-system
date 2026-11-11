import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = {
  PATIENT: [
    { to: '/patient/dashboard', label: 'Dashboard' },
    { to: '/patient/appointments', label: 'Appointments' },
    { to: '/patient/book', label: 'Book Slot' },
    { to: '/patient/billing', label: 'Billing' },
    { to: '/patient/prescriptions', label: 'Prescriptions' },
    { to: '/patient/reports', label: 'Lab Reports' },
    { to: '/patient/records', label: 'My Records' },
    { to: '/patient/complaints', label: 'Complaints' },
  ],
  DOCTOR: [
    { to: '/doctor/dashboard', label: 'Dashboard' },
    { to: '/doctor/appointments', label: 'Appointments' },
    { to: '/doctor/queue', label: 'Queue' },
    { to: '/doctor/prescriptions', label: 'Prescriptions' },
  ],
  LAB_TECHNICIAN: [
    { to: '/lab/dashboard', label: 'Upload Reports' },
    { to: '/lab/reports', label: 'All Reports' },
  ],
  RECEPTIONIST: [
    { to: '/receptionist/dashboard', label: 'Dashboard' },
    { to: '/receptionist/appointments', label: 'Appointments' },
    { to: '/receptionist/billing', label: 'Billing' },
    { to: '/receptionist/queue', label: 'Queues' },
  ],
  ADMINISTRATOR: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/doctors', label: 'Doctors' },
    { to: '/admin/queue', label: 'Queues' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/billing', label: 'Billing' },
    { to: '/admin/complaints', label: 'Complaints' },
    { to: '/admin/settings', label: 'Slot Settings' },
    { to: '/admin/audit', label: 'Audit Log' },
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const links = user ? [...(NAV_LINKS[user.role] || []), { to: '/profile', label: 'My Profile' }] : []

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          M
        </span>
        MediQueue
      </div>
      <nav className="sidebar-nav" aria-label="Main">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className="sidebar-link">
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
