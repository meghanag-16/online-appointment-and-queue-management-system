import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import QueueTable from '../components/queue/QueueTable'

const entry = (over) => ({
  queueId: over.appointmentId, patientName: 'P', slotStart: '2026-11-12T09:00:00', slotEnd: '2026-11-12T09:30:00',
  priority: 'NORMAL', visitStatus: 'WAITING', overridePosition: null, ...over,
})

describe('QueueTable', () => {
  test('shows active patients in position order and finished visits separately', () => {
    render(<QueueTable renderActions={() => null} entries={[
      entry({ appointmentId: 1, patientName: 'Asha', queuePosition: 1, visitStatus: 'IN_CONSULTATION' }),
      entry({ appointmentId: 2, patientName: 'Bina', queuePosition: 2, priority: 'HIGH_PRIORITY' }),
      entry({ appointmentId: 3, patientName: 'Chitra', queuePosition: null, visitStatus: 'FINISHED' }),
    ]} />)
    expect(within(screen.getByTestId('queue-row-1')).getByText('In Consultation')).toBeInTheDocument()
    expect(within(screen.getByTestId('queue-row-2')).getByText('High Priority')).toBeInTheDocument()
    expect(screen.getByText(/seen today \(1\)/i)).toBeInTheDocument()
    expect(screen.queryByTestId('queue-row-3')).not.toBeInTheDocument()
  })

  test('shows the empty message when nobody is waiting', () => {
    render(<QueueTable renderActions={() => null} entries={[]} emptyText="Nobody is waiting today." />)
    expect(screen.getByText('Nobody is waiting today.')).toBeInTheDocument()
  })

  test('marks an administrator override with a pin', () => {
    render(<QueueTable renderActions={() => null} entries={[entry({ appointmentId: 5, queuePosition: 1, overridePosition: 1 })]} />)
    expect(screen.getByTitle('Position set by the administrator')).toBeInTheDocument()
  })
})
