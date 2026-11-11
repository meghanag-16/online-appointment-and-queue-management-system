import { useEffect, useRef } from 'react'

/** Calls onEscape when the Escape key is pressed while the component is mounted (closes dialogs from the keyboard). */
export function useEscapeKey(onEscape) {
  const saved = useRef(onEscape)
  saved.current = onEscape

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') saved.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}
