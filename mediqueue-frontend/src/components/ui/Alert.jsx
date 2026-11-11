/** An inline message. tone: error | success | warning | info. Errors are announced to screen readers. */
export default function Alert({ tone = 'info', className = '', children, action, ...rest }) {
  if (!children) return null
  return (
    <div className={`alert alert-${tone} ${className}`.trim()} role={tone === 'error' ? 'alert' : 'status'} {...rest}>
      {children}
      {action}
    </div>
  )
}
