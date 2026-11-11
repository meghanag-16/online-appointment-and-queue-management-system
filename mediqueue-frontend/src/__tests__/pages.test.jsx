import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// ── mocks: the API answers every page's requests with small sample data ───────
jest.mock('../api/axiosInstance', () => {
  const api = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn() }
  return {
    __esModule: true,
    default: api,
    errorMessage: (err, fallback) => err?.response?.data?.error || fallback,
    TOKEN_KEY: 'mq_token',
    USER_KEY: 'mq_user',
    ACCESS_DENIED_EVENT: 'mq:access-denied',
  }
})

let mockRole = 'PATIENT'
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 'U-1', username: 'tester', name: 'Test User', role: mockRole },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateUser: jest.fn(),
  }),
}))

import axiosInstance from '../api/axiosInstance'

const appointment = {
  appointmentId: 41,
  patientId: 'P-1',
  patientName: 'Riya Nair',
  doctorId: 'D-1',
  doctorName: 'Dr. Arjun Mehta',
  departmentName: 'Cardiology',
  appointmentDate: '2030-01-10',
  startTime: '2030-01-10T10:00:00',
  endTime: '2030-01-10T10:30:00',
  status: 'BOOKED',
  priority: 'NORMAL',
  reasonForVisit: 'Chest pain',
  allowedStatuses: ['CONFIRMED', 'CANCELLED'],
  canCancel: true,
  canReschedule: true,
}
const bill = {
  billId: 9,
  appointmentId: 41,
  patientId: 'P-1',
  patientName: 'Riya Nair',
  doctorName: 'Dr. Arjun Mehta',
  totalAmount: 800,
  paymentStatus: 'PENDING',
  billingStrategy: 'STANDARD',
  billingRule: 'Standard consultation fee',
}
const report = {
  reportId: 3,
  appointmentId: 41,
  reportType: 'Blood test',
  fileName: 'cbc.pdf',
  fileSize: 2048,
  patientName: 'Riya Nair',
  doctorName: 'Dr. Arjun Mehta',
}
const queueEntry = {
  queueId: 5,
  appointmentId: 41,
  patientId: 'P-1',
  patientName: 'Riya Nair',
  doctorId: 'D-1',
  slotStart: '2030-01-10T10:00:00',
  slotEnd: '2030-01-10T10:30:00',
  priority: 'HIGH_PRIORITY',
  queuePosition: 1,
  visitStatus: 'WAITING',
}

/** What the mocked API returns for a URL. */
function respond(url) {
  const data = (() => {
    if (url.startsWith('/patient/dashboard'))
      return { upcomingAppointments: 2, pendingBills: 1, reportsReady: 3, openComplaints: 0 }
    if (url.startsWith('/doctor/dashboard'))
      return { todaysAppointments: 4, inQueue: 2, pendingPrescriptions: 1, completedToday: 1 }
    if (url.startsWith('/admin/dashboard'))
      return {
        totalUsers: 20,
        activeUsers: 18,
        inactiveUsers: 2,
        activePatients: 5,
        totalDoctors: 10,
        todaysAppointments: 3,
      }
    if (url.startsWith('/appointments/stats'))
      return { todayTotal: 3, todayBooked: 2, todayCompleted: 1, todayCancelled: 0, totalAll: 9 }
    if (url.startsWith('/settings/slots'))
      return {
        slotMinutes: 30,
        dayStart: '09:00',
        dayEnd: '17:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        workingDays: ['MONDAY', 'TUESDAY'],
        bookingWindowDays: 7,
        changeCutoffHours: 2,
      }
    if (url.startsWith('/auth/me'))
      return { userId: 'U-1', username: 'tester', name: 'Test User', role: mockRole, email: 't@x.test' }
    if (url.startsWith('/patient/records'))
      return {
        recordId: '1',
        diagnoses: '01 Jan 2030 · Dr. Mehta: Fever',
        observations: 'No observations recorded yet.',
      }
    if (url.startsWith('/notifications/mine')) return { unreadCount: 0, items: [] }
    if (url.startsWith('/appointments')) return [appointment]
    if (url.startsWith('/billing')) return [bill]
    if (url.startsWith('/lab')) return [report]
    if (url.startsWith('/queue')) return [queueEntry]
    if (url.startsWith('/doctors/search') || url.startsWith('/admin/doctors'))
      return [
        {
          userId: 'D-1',
          name: 'Dr. Arjun Mehta',
          specialization: 'Cardiologist',
          departmentName: 'Cardiology',
          accountStatus: 'ACTIVE',
        },
      ]
    if (url.startsWith('/departments') || url.startsWith('/admin/departments'))
      return [{ departmentId: 'DEPT-CARD', departmentName: 'Cardiology' }]
    if (url.startsWith('/users'))
      return [
        { userId: 'U-2', name: 'Ritu Verma', username: 'reception', role: 'RECEPTIONIST', accountStatus: 'ACTIVE' },
      ]
    if (url.startsWith('/complaints'))
      return [
        {
          complaintId: 'CMP-1',
          issueType: 'Billing',
          description: 'Charged twice',
          status: 'OPEN',
          patientName: 'Riya Nair',
        },
      ]
    if (url.startsWith('/prescriptions'))
      return [
        {
          prescriptionId: 2,
          appointmentId: 41,
          doctorName: 'Dr. Arjun Mehta',
          patientName: 'Riya Nair',
          diagnosisNotes: 'Fever',
          medicationList: 'Paracetamol',
        },
      ]
    if (url.startsWith('/admin/audit'))
      return [{ auditId: 1, actorName: 'Admin', action: 'APPOINTMENT_BOOKED', details: 'Booked' }]
    return []
  })()
  return Promise.resolve({ data })
}

beforeEach(() => {
  axiosInstance.get.mockImplementation(respond)
})

function renderPage(Page, role, path = '/') {
  mockRole = role
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>,
  )
}

// ── one smoke test per page: it renders and shows its main content ───────────
const cases = [
  ['patient dashboard', () => require('../pages/patient/PatientDashboard').default, 'PATIENT', 'Upcoming Appointments'],
  ['my appointments', () => require('../pages/patient/PatientAppointments').default, 'PATIENT', 'Chest pain'],
  ['book appointment', () => require('../pages/patient/BookAppointment').default, 'PATIENT', 'Dr. Arjun Mehta'],
  ['patient billing', () => require('../pages/patient/PatientBilling').default, 'PATIENT', 'Standard consultation fee'],
  ['patient complaints', () => require('../pages/patient/PatientComplaints').default, 'PATIENT', 'Charged twice'],
  ['patient prescriptions', () => require('../pages/patient/PatientPrescriptions').default, 'PATIENT', 'Paracetamol'],
  ['medical record', () => require('../pages/patient/PatientRecords').default, 'PATIENT', /Dr. Mehta: Fever/],
  ['patient lab reports', () => require('../pages/patient/PatientReports').default, 'PATIENT', 'Blood test'],
  ['doctor dashboard', () => require('../pages/doctor/DoctorDashboard').default, 'DOCTOR', 'Pending Prescriptions'],
  ['doctor appointments', () => require('../pages/doctor/DoctorAppointments').default, 'DOCTOR', 'Chest pain'],
  ['doctor queue', () => require('../pages/doctor/DoctorQueue').default, 'DOCTOR', 'Call next patient'],
  [
    'doctor prescriptions',
    () => require('../pages/doctor/DoctorPrescriptions').default,
    'DOCTOR',
    'Issued prescriptions',
  ],
  ['lab upload', () => require('../pages/labtechnician/LabDashboard').default, 'LAB_TECHNICIAN', 'Upload Lab Reports'],
  ['lab reports', () => require('../pages/labtechnician/LabReports').default, 'LAB_TECHNICIAN', 'cbc.pdf'],
  [
    'front desk dashboard',
    () => require('../pages/receptionist/ReceptionistDashboard').default,
    'RECEPTIONIST',
    'Total All Time',
  ],
  [
    'front desk appointments',
    () => require('../pages/receptionist/ReceptionistAppointments').default,
    'RECEPTIONIST',
    'Riya Nair',
  ],
  ['billing desk', () => require('../pages/receptionist/BillingDesk').default, 'RECEPTIONIST', 'Mark paid'],
  ['queue board', () => require('../pages/shared/QueueBoard').default, 'RECEPTIONIST', 'Unmark priority'],
  ['admin dashboard', () => require('../pages/admin/AdminDashboard').default, 'ADMINISTRATOR', 'Active doctors'],
  ['admin users', () => require('../pages/admin/AdminUsers').default, 'ADMINISTRATOR', 'Ritu Verma'],
  ['admin doctors', () => require('../pages/admin/AdminDoctors').default, 'ADMINISTRATOR', 'Onboard new doctor'],
  ['admin departments', () => require('../pages/admin/AdminDepartments').default, 'ADMINISTRATOR', 'Cardiology'],
  ['admin complaints', () => require('../pages/admin/AdminComplaints').default, 'ADMINISTRATOR', 'Charged twice'],
  ['slot settings', () => require('../pages/admin/AdminSettings').default, 'ADMINISTRATOR', 'Save settings'],
  ['audit log', () => require('../pages/admin/AdminAudit').default, 'ADMINISTRATOR', 'Booked'],
  ['my profile', () => require('../pages/shared/ProfilePage').default, 'PATIENT', 'Change password'],
  ['landing page', () => require('../pages/landing/LandingPage').default, 'PATIENT', 'Everything a clinic visit needs'],
  ['not found', () => require('../pages/shared/NotFound').default, 'PATIENT', 'Page not found'],
  ['access denied', () => require('../pages/shared/Unauthorized').default, 'PATIENT', 'Access Denied'],
]

describe.each(cases)('%s page', (_name, load, role, expected) => {
  test('renders its main content', async () => {
    renderPage(load(), role)
    expect(await screen.findAllByText(expected)).not.toHaveLength(0)
  })
})

describe('error states', () => {
  test('a failed load shows the reason and a Try again button', async () => {
    axiosInstance.get.mockImplementation(url =>
      url.startsWith('/appointments')
        ? Promise.reject({ response: { data: { error: 'Database is down' } } })
        : respond(url),
    )
    renderPage(require('../pages/patient/PatientAppointments').default, 'PATIENT')
    expect(await screen.findByText('Database is down')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  test('an empty list shows an empty state, not a blank table', async () => {
    axiosInstance.get.mockImplementation(url =>
      url.startsWith('/appointments') ? Promise.resolve({ data: [] }) : respond(url),
    )
    renderPage(require('../pages/patient/PatientAppointments').default, 'PATIENT')
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument())
    expect(screen.getByText('No appointments yet')).toBeInTheDocument()
  })
})
