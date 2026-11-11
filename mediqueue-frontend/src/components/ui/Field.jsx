import { useId } from 'react'

/**
 * A labelled form field with an optional hint and a validation message. Input, Select and Textarea
 * below wrap their control in it, so every form shows labels, hints and errors the same way.
 */
export function Field({ id, label, hint, error, required, className = '', children }) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && (
            <span className="form-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <small id={`${id}-hint`} className="form-hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="form-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

function useFieldProps({ id, hint, error }) {
  const generated = useId()
  const fieldId = id || generated
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
  return { fieldId, describedBy }
}

export function Input({ id, label, hint, error, required, className = '', fieldClassName, ...rest }) {
  const { fieldId, describedBy } = useFieldProps({ id, hint, error })
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} className={fieldClassName}>
      <input
        id={fieldId}
        className={`form-control ${className}`.trim()}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </Field>
  )
}

/** options: [{ value, label }] or plain strings; `placeholder` adds an empty first option. */
export function Select({
  id,
  label,
  hint,
  error,
  required,
  options = [],
  placeholder,
  className = '',
  fieldClassName,
  children,
  ...rest
}) {
  const { fieldId, describedBy } = useFieldProps({ id, hint, error })
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} className={fieldClassName}>
      <select
        id={fieldId}
        className={`form-control ${className}`.trim()}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
        {children}
      </select>
    </Field>
  )
}

export function Textarea({ id, label, hint, error, required, rows = 3, className = '', fieldClassName, ...rest }) {
  const { fieldId, describedBy } = useFieldProps({ id, hint, error })
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} className={fieldClassName}>
      <textarea
        id={fieldId}
        rows={rows}
        className={`form-control ${className}`.trim()}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </Field>
  )
}
