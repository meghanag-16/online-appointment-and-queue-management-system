import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = {
  PATIENT: [
    { to: '/patient/dashboard',    label: 'Dashboard'    },
    { to: '/patient/appointments', label: 'Appointments' },
    { to: '/patient/book',         label: 'Book Slot'    },
    { to: '/patient/doctors',      label: 'Find Doctors' },
    { to: '/patient/billing',      label: 'Billing'      },
    { to: '/patient/records',      label: 'My Records'   },
    { to: '/patient/complaints',   label: 'Complaints'   },
  ],
  DOCTOR: [
    { to: '/doctor/dashboard',     label: 'Dashboard'     },
    { to: '/doctor/appointments',  label: 'Appointments'  },
    { to: '/doctor/queue',         label: 'Queue'         },
    { to: '/doctor/prescriptions', label: 'Prescriptions' },
  ],
  LAB_TECHNICIAN: [
    { to: '/lab/dashboard', label: 'Dashboard'   },
    { to: '/lab/reports',   label: 'Lab Reports' },
  ],
  RECEPTIONIST: [
    { to: '/receptionist/dashboard',    label: 'Dashboard'    },
    { to: '/receptionist/appointments', label: 'Appointments' },
  ],
  ADMINISTRATOR: [
    { to: '/admin/dashboard',   label: 'Dashboard'   },
    { to: '/admin/users',       label: 'Users'       },
    { to: '/admin/doctors',     label: 'Doctors'     },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/complaints',  label: 'Complaints'  },
  ],
}

const sidebarStyle = {
  position: 'fixed', top: 0, left: 0, bottom: 0,
  width: 'var(--sidebar-w)', background: 'var(--color-dark)',
  display: 'flex', flexDirection: 'column', zIndex: 200,
  overflowY: 'auto',
}

const headerStyle = {
  padding: '24px 20px 20px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 8,
}

const brandStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.4rem', color: 'var(--color-white)',
  display: 'flex', alignItems: 'center', gap: 10,
}

const dotStyle = {
  width: 28, height: 28, borderRadius: 8,
  background: 'var(--color-accent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1rem', color: '#fff', fontWeight: 700,
}

export default function Sidebar() {
  const { user } = useAuth()
  const links = NAV_LINKS[user?.role] || []

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <div style={brandStyle}>
          <div style={dotStyle}>M</div>
          MediQueue
        </div>
      </div>
      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'block',
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 2,
              color: isActive ? 'var(--color-white)' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'var(--color-accent)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
