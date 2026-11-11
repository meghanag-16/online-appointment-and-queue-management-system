import { formatSlot } from '../../utils/dates'

/**
 * Clickable suggestions returned by the server when a slot is taken (409 alternateSlots).
 * Props: alternates, onPick(alt)
 */
export default function AlternateSlots({ alternates, onPick }) {
  if (!alternates?.length) return null
  return (
    <div className="mt-4" data-testid="alternate-slots">
      <p className="strong mb-2 text-accent">Suggested alternate slots</p>
      <div className="choice-grid">
        {alternates.map(alt => (
          <button key={alt.slotId} type="button" className="choice is-highlight" onClick={() => onPick(alt)}>
            <span className="choice-title block">{alt.doctorName}</span>
            <span className="choice-sub block">
              {alt.reason === 'same_doctor'
                ? 'Same doctor'
                : `Same department${alt.departmentName ? ` · ${alt.departmentName}` : ''}`}
            </span>
            <span className="block text-sm">{formatSlot(alt.startTime)}</span>
            <span className="choice-meta block mt-2">Choose this slot →</span>
          </button>
        ))}
      </div>
    </div>
  )
}
