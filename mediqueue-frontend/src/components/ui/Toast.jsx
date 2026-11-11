import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)
const DURATION_MS = 4500

/** Short confirmations ("Appointment booked") in the bottom corner; they disappear on their own. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback(id => setToasts(list => list.filter(t => t.id !== id)), [])

  const show = useCallback(
    (tone, message) => {
      const id = nextId.current++
      setToasts(list => [...list.slice(-3), { id, tone, message }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: message => show('success', message),
      error: message => show('error', message),
      info: message => show('info', message),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
            <span>{t.message}</span>
            <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** toast.success(text) / toast.error(text) / toast.info(text). Works without a provider (no-op). */
export function useToast() {
  return useContext(ToastContext) || NO_TOASTS
}

const NO_TOASTS = { success: () => {}, error: () => {}, info: () => {} }
