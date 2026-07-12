import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  required = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          {label} {required && <span className="text-status-red">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          required={required}
          className={`w-full ${Icon ? 'pl-9' : 'px-3'} py-2 bg-white border rounded-sm text-xs text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:border-primary ${
            error ? 'border-status-red focus:border-status-red bg-status-red/5' : 'border-border hover:border-gray-400'
          } ${className}`}
          {...props}
        />
      </div>

      {error && <p className="mt-1 text-[11px] font-medium text-status-red">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[11px] text-text-secondary">{helperText}</p>}
    </div>
  );
}
