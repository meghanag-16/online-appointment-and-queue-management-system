import { formatSlot } from '../../utils/dates'

/**
 * Clickable suggestions returned by the server when a slot is taken (409 alternateSlots).
 * Props: alternates, onPick(alt)
 */
export default function AlternateSlots({ alternates, onPick }) {
  if (!alternates?.length) return null
  return (
    <div style={{ marginTop: 16 }} data-testid="alternate-slots">
      <p style={{ fontWeight: 600, marginBottom: 10, color: 'var(--color-accent)' }}>Suggested alternate slots</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {alternates.map(alt => (
          <button key={alt.slotId} type="button" onClick={() => onPick(alt)} style={card}>
            <div style={{ fontWeight: 600 }}>{alt.doctorName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 6px' }}>
              {alt.reason === 'same_doctor'
                ? 'Same doctor'
                : `Same department${alt.departmentName ? ` · ${alt.departmentName}` : ''}`}
            </div>
            <div style={{ fontSize: '0.85rem' }}>{formatSlot(alt.startTime)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: 6 }}>Choose this slot →</div>
          </button>
        ))}
      </div>
    </div>
  )
}

const card = {
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  border: '1.5px solid var(--color-accent)',
  background: 'var(--color-white)',
  color: 'var(--color-text)',
}
