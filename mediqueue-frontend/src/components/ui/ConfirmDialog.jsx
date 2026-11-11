import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'

const ConfirmContext = createContext(null)

/**
 * Asks before destructive actions (cancel, deactivate, refund, reset password...), in the app's own
 * dialog instead of the browser's window.confirm.
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: 'Cancel appointment?', message: '…', confirmLabel: 'Cancel it', danger: true }))) return
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    options =>
      new Promise(resolve => {
        resolver.current = resolve
        setRequest(typeof options === 'string' ? { message: options } : options)
      }),
    [],
  )

  const close = answer => {
    resolver.current?.(answer)
    resolver.current = null
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal
          size="sm"
          title={request.title || 'Are you sure?'}
          onClose={() => close(false)}
          testId="confirm-dialog"
          footer={
            <>
              <Button variant="outline" onClick={() => close(false)} data-testid="confirm-no">
                {request.cancelLabel || 'Keep it'}
              </Button>
              <Button
                variant={request.danger ? 'danger' : 'primary'}
                onClick={() => close(true)}
                data-testid="confirm-yes"
              >
                {request.confirmLabel || 'Confirm'}
              </Button>
            </>
          }
        >
          {request.message && <p>{request.message}</p>}
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

/** Returns confirm(options) → Promise<boolean>. Without a provider it falls back to window.confirm. */
export function useConfirm() {
  return useContext(ConfirmContext) || fallbackConfirm
}

function fallbackConfirm(options) {
  const text = typeof options === 'string' ? options : [options.title, options.message].filter(Boolean).join('\n\n')
  return Promise.resolve(window.confirm(text))
}
