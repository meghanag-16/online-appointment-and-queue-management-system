/**
 * The one button. variant: primary | outline | dark | danger | danger-outline | ghost;
 * size: sm | md | lg. `loading` disables it and shows a small spinner.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}) {
  const classes = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
