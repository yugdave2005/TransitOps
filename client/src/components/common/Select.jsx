import React from 'react';

export default function Select({
  label,
  error,
  helperText,
  options = [],
  required = false,
  className = '',
  id,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          {label} {required && <span className="text-status-red">*</span>}
        </label>
      )}

      <select
        id={selectId}
        required={required}
        className={`w-full px-3 py-2 bg-white border rounded-sm text-xs text-text-primary transition-colors focus:outline-none focus:border-primary ${
          error ? 'border-status-red focus:border-status-red bg-status-red/5' : 'border-border hover:border-gray-400'
        } ${className}`}
        {...props}
      >
        {children ? children : options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-[11px] font-medium text-status-red">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[11px] text-text-secondary">{helperText}</p>}
    </div>
  );
}
