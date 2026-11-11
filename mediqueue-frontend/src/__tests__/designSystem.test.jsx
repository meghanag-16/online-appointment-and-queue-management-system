import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  ErrorState,
  Badge,
  Table,
  ToastProvider,
  useToast,
  ConfirmProvider,
  useConfirm,
} from '../components/ui'
import { resolveApiBase } from '../api/axiosInstance'

describe('Button', () => {
  test('variants map to classes and loading disables it', () => {
    const onClick = jest.fn()
    const { rerender } = render(
      <Button variant="danger" size="sm" onClick={onClick}>
        Delete
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Delete' })
    expect(btn).toHaveClass('btn', 'btn-danger', 'btn-sm')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()

    rerender(<Button loading>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})

describe('Form fields', () => {
  test('label, hint and validation message are linked to the control', () => {
    render(<Input id="email" label="Email" hint="We never share it" error="Email is required" required />)
    const input = screen.getByLabelText(/Email/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'email-error')
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
    // the hint is replaced by the error while there is one
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument()
  })

  test('select renders a placeholder and options', () => {
    render(<Select id="g" label="Gender" placeholder="Choose" options={[{ value: 'F', label: 'Female' }, 'Other']} />)
    expect(screen.getByRole('option', { name: 'Choose' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Female' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument()
  })
})

describe('Modal', () => {
  test('closes on Escape, on the close button and on a click outside', () => {
    const onClose = jest.fn()
    render(
      <Modal title="Details" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(document.querySelector('.modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(3)
    // a click inside the panel does not close it
    fireEvent.click(screen.getByText('Body'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})

describe('Confirm dialog', () => {
  function Danger({ onResult }) {
    const confirm = useConfirm()
    return (
      <button
        onClick={async () => onResult(await confirm({ title: 'Delete it?', confirmLabel: 'Delete', danger: true }))}
      >
        Ask
      </button>
    )
  }

  test('resolves true on confirm and false on cancel', async () => {
    const onResult = jest.fn()
    render(
      <ConfirmProvider>
        <Danger onResult={onResult} />
      </ConfirmProvider>,
    )
    fireEvent.click(screen.getByText('Ask'))
    expect(await screen.findByRole('dialog', { name: 'Delete it?' })).toBeInTheDocument()
    await act(async () => fireEvent.click(screen.getByTestId('confirm-yes')))
    expect(onResult).toHaveBeenLastCalledWith(true)

    fireEvent.click(screen.getByText('Ask'))
    await act(async () => fireEvent.click(await screen.findByTestId('confirm-no')))
    expect(onResult).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Toast', () => {
  test('shows a message and hides it after a few seconds', () => {
    jest.useFakeTimers()
    function Trigger() {
      const toast = useToast()
      return <button onClick={() => toast.success('Saved!')}>Go</button>
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('Go'))
    expect(screen.getByText('Saved!')).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(6000))
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
    jest.useRealTimers()
  })
})

describe('States, badge and table', () => {
  test('empty state, error state with retry, badge tone and empty table row', () => {
    const retry = jest.fn()
    render(
      <>
        <EmptyState title="Nothing here" description="Add one" />
        <ErrorState message="Failed" onRetry={retry} />
        <Badge tone="success">Paid</Badge>
        <Table headers={['A', 'B']} empty="No rows" isEmpty />
      </>,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(retry).toHaveBeenCalled()
    expect(screen.getByText('Paid')).toHaveClass('badge-success')
    expect(screen.getByText('No rows').closest('td')).toHaveAttribute('colspan', '2')
  })
})

describe('API address', () => {
  test('defaults to the same-origin path and expands a bare host', () => {
    expect(resolveApiBase('')).toBe('/api/v1')
    expect(resolveApiBase('/api/v1')).toBe('/api/v1')
    expect(resolveApiBase('mediqueue-api.onrender.com')).toBe('https://mediqueue-api.onrender.com/api/v1')
    expect(resolveApiBase('https://api.example.com/')).toBe('https://api.example.com/api/v1')
    expect(resolveApiBase('https://api.example.com/api/v1')).toBe('https://api.example.com/api/v1')
  })
})
