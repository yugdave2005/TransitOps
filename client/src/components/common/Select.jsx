import React from 'react';
import { ChevronDown } from 'lucide-react';

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
        <label htmlFor={selectId} className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
          {label} {required && <span className="text-status-red">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          required={required}
          className={`w-full px-3 py-2 pr-8 bg-white border rounded text-xs text-text-primary appearance-none transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
            error ? 'border-status-red focus:border-status-red focus:ring-status-red bg-status-red/5' : 'border-border hover:border-gray-400'
          } ${className}`}
          {...props}
        >
          {children ? children : options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-text-muted">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {error && <p className="mt-1 text-[10px] font-medium text-status-red">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[10px] text-text-secondary">{helperText}</p>}
    </div>
  );
}
