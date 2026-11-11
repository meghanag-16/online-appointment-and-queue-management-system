import { useEffect, useRef } from 'react'

/**
 * Calls fn now and then every intervalMs while the page is open (paused while the tab is hidden),
 * so screens like the queue update without a manual reload.
 */
export function usePolling(fn, intervalMs, deps = []) {
  const saved = useRef(fn)
  saved.current = fn

  useEffect(() => {
    let timer
    const tick = () => { if (!document.hidden) saved.current() }
    saved.current()
    timer = setInterval(tick, intervalMs)
    return () => clearInterval(timer)
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}
