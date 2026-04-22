import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

// ── Mock react-router-dom ─────────────────────────────────────────────────────
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to, style }) => <a href={to} style={typeof style === 'function' ? style({ isActive: false }) : style}>{children}</a>,
}))

// ── Mock AuthContext ───────────────────────────────────────────────────────────
const mockLogin    = jest.fn()
const mockRegister = jest.fn()
const mockLogout   = jest.fn()

let mockUser = null

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user:            mockUser,
    login:           mockLogin,
    logout:          mockLogout,
    register:        mockRegister,
    isAuthenticated: !!mockUser,
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}))

// ── Mock axiosInstance ────────────────────────────────────────────────────────
jest.mock('../api/axiosInstance', () => ({
  default: {
    get:  jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}))

import axiosInstance from '../api/axiosInstance'

// ─────────────────────────────────────────────────────────────────────────────
// Component imports
// ─────────────────────────────────────────────────────────────────────────────
import StatusBadge  from '../components/common/StatusBadge'
import Spinner      from '../components/common/Spinner'
import PageTitle    from '../components/common/PageTitle'
import LoginPage    from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
describe('StatusBadge', () => {
  test('renders BOOKED status', () => {
    render(<StatusBadge status="BOOKED" />)
    expect(screen.getByText('Booked')).toBeInTheDocument()
  })

  test('renders PAID status', () => {
    render(<StatusBadge status="PAID" />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  test('renders CANCELLED status', () => {
    render(<StatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  test('renders unknown status gracefully', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />)
    expect(screen.getByText('Unknown Status')).toBeInTheDocument()
  })

  test('renders null status without crashing', () => {
    render(<StatusBadge status={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────
describe('Spinner', () => {
  test('renders without crashing', () => {
    const { container } = render(<Spinner />)
    expect(container.firstChild).toBeInTheDocument()
  })

  test('accepts custom size prop', () => {
    render(<Spinner size={48} />)
    const spinner = screen.getByTestId('spinner')
    expect(spinner).toHaveStyle({ width: '48px', height: '48px' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PageTitle
// ─────────────────────────────────────────────────────────────────────────────
describe('PageTitle', () => {
  test('renders title text', () => {
    render(<PageTitle title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('renders subtitle when provided', () => {
    render(<PageTitle title="Dashboard" subtitle="Your health summary" />)
    expect(screen.getByText('Your health summary')).toBeInTheDocument()
  })

  test('does not render subtitle element when omitted', () => {
    render(<PageTitle title="Dashboard" />)
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage
// ─────────────────────────────────────────────────────────────────────────────
describe('LoginPage', () => {
  beforeEach(() => {
    mockUser = null
    mockLogin.mockReset()
    mockNavigate.mockReset()
  })

  test('renders username and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  test('renders sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('renders register link', () => {
    render(<LoginPage />)
    expect(screen.getByText(/register/i)).toBeInTheDocument()
  })

  test('calls login with correct credentials on submit', async () => {
    mockLogin.mockResolvedValue({ role: 'PATIENT', userId: 'p1', username: 'anika' })
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'anika' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('anika', 'secret123')
    })
  })

  test('navigates to patient dashboard on successful login', async () => {
    mockLogin.mockResolvedValue({ role: 'PATIENT', userId: 'p1', username: 'anika' })
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'anika' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard', { replace: true })
    })
  })

  test('shows error message on failed login', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } }
    })
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'bad' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'bad' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  test('button shows loading state while logging in', async () => {
    mockLogin.mockImplementation(() => new Promise(res => setTimeout(res, 500)))
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'a' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'b' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// RegisterPage
// ─────────────────────────────────────────────────────────────────────────────
describe('RegisterPage', () => {
  beforeEach(() => {
    mockUser = null
    mockRegister.mockReset()
    mockNavigate.mockReset()
  })

  test('renders all required form fields', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/min. 8/i)).toBeInTheDocument()
  })

  test('renders role selector with PATIENT as default', () => {
    render(<RegisterPage />)
    const select = screen.getByLabelText(/role/i)
    expect(select.value).toBe('PATIENT')
  })

  test('role selector has all 5 roles', () => {
    render(<RegisterPage />)
    const select = screen.getByLabelText(/role/i)
    const options = within(select).getAllByRole('option')
    expect(options).toHaveLength(5)
    const values = options.map(o => o.value)
    expect(values).toContain('PATIENT')
    expect(values).toContain('DOCTOR')
    expect(values).toContain('ADMINISTRATOR')
  })

  test('calls register with correct payload on submit', async () => {
    mockRegister.mockResolvedValue({ role: 'PATIENT', userId: 'p2', username: 'bob' })
    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText(/full name/i),   { target: { value: 'Bob Kumar' } })
    fireEvent.change(screen.getByPlaceholderText(/username/i),    { target: { value: 'bob' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example/i), { target: { value: 'bob@x.com' } })
    fireEvent.change(screen.getByPlaceholderText(/min. 8/i),      { target: { value: 'password1' } })
    fireEvent.change(screen.getByPlaceholderText(/enter phone number/i), { target: { value: '9876543210' } })
    fireEvent.change(screen.getByLabelText(/gender/i),               { target: { value: 'MALE' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i),         { target: { value: '1990-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Bob Kumar', username: 'bob', email: 'bob@x.com',
        password: 'password1', role: 'PATIENT',
      }))
    })
  })

  test('shows error on registration failure', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { error: 'Username already taken: bob' } }
    })
    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText(/full name/i),   { target: { value: 'Bob' } })
    fireEvent.change(screen.getByPlaceholderText(/username/i),    { target: { value: 'bob' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example/i), { target: { value: 'b@x.com' } })
    fireEvent.change(screen.getByPlaceholderText(/min. 8/i),      { target: { value: 'password1' } })
    fireEvent.change(screen.getByPlaceholderText(/enter phone number/i), { target: { value: '9876543210' } })
    fireEvent.change(screen.getByLabelText(/gender/i),               { target: { value: 'FEMALE' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i),         { target: { value: '1992-05-20' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/username already taken/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// formatters utility
// ─────────────────────────────────────────────────────────────────────────────
import { formatDate, formatCurrency, formatEnum, formatDateTime } from '../utils/formatters'

describe('formatters', () => {
  test('formatDate handles null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  test('formatCurrency formats INR correctly', () => {
    const result = formatCurrency(500)
    expect(result).toContain('500')
  })

  test('formatCurrency handles null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  test('formatEnum converts SCREAMING_SNAKE to Title Case', () => {
    expect(formatEnum('HIGH_PRIORITY')).toBe('High Priority')
    expect(formatEnum('IN_PROGRESS')).toBe('In Progress')
  })

  test('formatEnum handles null', () => {
    expect(formatEnum(null)).toBe('—')
  })
})
