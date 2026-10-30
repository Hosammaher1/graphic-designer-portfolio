import React, { useId } from 'react';

export function Select({
  id: explicitId,
  label,
  error,
  hint,
  required = false,
  disabled = false,
  options = [],
  children,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const selectId = explicitId || generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`form-select ${className}`.trim()}
        {...props}
      >
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
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

export default Select;
