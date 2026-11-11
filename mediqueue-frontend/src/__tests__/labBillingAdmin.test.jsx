import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('../api/axiosInstance', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn() },
  errorMessage: (err, fallback) => err?.response?.data?.error || fallback,
}))

jest.mock('../api/notificationApi', () => ({
  getMyNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(() => Promise.resolve({})),
  markAllNotificationsRead: jest.fn(() => Promise.resolve({})),
}))

import { checkLabFile, LAB_MAX_BYTES } from '../api/labApi'
import NotificationBell from '../components/layout/NotificationBell'
import TemporaryPasswordNotice from '../components/common/TemporaryPasswordNotice'
import ReportsTable from '../components/lab/ReportsTable'
import StatusBadge from '../components/common/StatusBadge'
import { getMyNotifications, markNotificationAsRead } from '../api/notificationApi'

const fileOf = (name, size) => ({ name, size })

describe('lab file check (same rules as the server)', () => {
  test('accepts PDF, PNG and JPEG up to 10 MB', () => {
    expect(checkLabFile(fileOf('cbc.pdf', 1000))).toBe('')
    expect(checkLabFile(fileOf('xray.PNG', 1000))).toBe('')
    expect(checkLabFile(fileOf('scan.jpeg', LAB_MAX_BYTES))).toBe('')
  })
  test('rejects other types, empty and oversized files, and no file', () => {
    expect(checkLabFile(fileOf('notes.docx', 1000))).toMatch(/PDF, PNG and JPEG/)
    expect(checkLabFile(fileOf('a.pdf', 0))).toMatch(/empty/)
    expect(checkLabFile(fileOf('a.pdf', LAB_MAX_BYTES + 1))).toMatch(/10 MB/)
    expect(checkLabFile(null)).toMatch(/Choose a file/)
  })
})

describe('NotificationBell', () => {
  beforeEach(() => {
    getMyNotifications.mockResolvedValue({ data: {
      unreadCount: 2,
      items: [
        { notificationId: 7, type: 'REPORT_READY', message: 'Your lab report "Blood test" is ready.', timestamp: '2026-11-12T09:00:00', read: false },
        { notificationId: 6, type: 'APPOINTMENT_REMINDER', message: 'Reminder: appointment tomorrow', timestamp: '2026-11-11T09:00:00', read: true },
      ],
    } })
  })

  test('shows the unread count and the list, and marks an unread one as read', async () => {
    render(<NotificationBell />)
    expect(await screen.findByTestId('notification-count')).toHaveTextContent('2')
    fireEvent.click(screen.getByTestId('notification-bell'))
    expect(await screen.findByText(/Blood test/)).toBeInTheDocument()
    expect(screen.getByText('Report Ready')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('notification-7'))
    await waitFor(() => expect(markNotificationAsRead).toHaveBeenCalledWith(7))
  })
})

describe('TemporaryPasswordNotice', () => {
  test('shows the one-time password and who it is for', () => {
    render(<TemporaryPasswordNotice name="Dr. Rao" username="drrao" password="Ab3$xyzPQR7k" />)
    expect(screen.getByTestId('temp-password')).toHaveTextContent('Ab3$xyzPQR7k')
    expect(screen.getByText('drrao')).toBeInTheDocument()
    expect(screen.getByText(/shown only once/i)).toBeInTheDocument()
  })
})

describe('ReportsTable', () => {
  test('lists reports with a download button, and patient columns for staff', () => {
    render(<ReportsTable showPatient reports={[{
      reportId: 3, appointmentId: 12, appointmentDate: '2026-11-12', reportType: 'Lipid profile',
      fileName: 'lipid.pdf', fileSize: 2048, uploadTime: '2026-11-12T11:00:00', remarks: 'Fasting',
      patientName: 'Asha', patientId: 'PAT-1', doctorName: 'Rao',
    }]} />)
    const row = screen.getByTestId('report-row-3')
    expect(row).toHaveTextContent('Lipid profile')
    expect(row).toHaveTextContent('Asha')
    expect(row).toHaveTextContent('2 KB')
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  test('shows the empty message', () => {
    render(<ReportsTable reports={[]} emptyText="No lab reports yet." />)
    expect(screen.getByText('No lab reports yet.')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  test('labels the new bill and complaint states', () => {
    render(<><StatusBadge status="VOID" /><StatusBadge status="UNDER_REVIEW" /><StatusBadge status="FOLLOW_UP" /></>)
    expect(screen.getByText('Void')).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getByText('Follow Up')).toBeInTheDocument()
  })
})
