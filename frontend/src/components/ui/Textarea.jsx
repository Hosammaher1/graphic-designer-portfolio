import React, { useId } from 'react';

export function Textarea({
  id: explicitId,
  label,
  error,
  hint,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = explicitId || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        required={required}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`form-textarea ${className}`.trim()}
        {...props}
      />
      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

export default Textarea;
