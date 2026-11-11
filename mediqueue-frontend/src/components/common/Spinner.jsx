import { LoadingState } from '../ui/States'

/** Kept for existing imports; the loading state now lives in the design system. */
export default function Spinner({ label }) {
  return <LoadingState label={label} />
}
