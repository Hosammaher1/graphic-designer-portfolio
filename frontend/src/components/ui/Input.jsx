import React, { useId } from 'react';

export function Input({
  id: explicitId,
  label,
  error,
  hint,
  required = false,
  disabled = false,
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
      <input
        id={inputId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`form-input ${className}`.trim()}
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

export default Input;
