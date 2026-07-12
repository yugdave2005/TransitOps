import React from 'react';

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Available', bg: 'bg-status-green/15', text: 'text-status-green', border: 'border-status-green/30' },
  ON_TRIP: { label: 'On Trip', bg: 'bg-status-blue/15', text: 'text-status-blue', border: 'border-status-blue/30' },
  DISPATCHED: { label: 'Dispatched', bg: 'bg-status-blue/15', text: 'text-status-blue', border: 'border-status-blue/30' },
  IN_SHOP: { label: 'In Shop', bg: 'bg-status-orange/15', text: 'text-status-orange', border: 'border-status-orange/30' },
  OFF_DUTY: { label: 'Off Duty', bg: 'bg-status-orange/15', text: 'text-status-orange', border: 'border-status-orange/30' },
  RETIRED: { label: 'Retired', bg: 'bg-status-red/15', text: 'text-status-red', border: 'border-status-red/30' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-status-red/15', text: 'text-status-red', border: 'border-status-red/30' },
  DRAFT: { label: 'Draft', bg: 'bg-status-yellow/15', text: 'text-yellow-700', border: 'border-status-yellow/40' },
  COMPLETED: { label: 'Completed', bg: 'bg-status-green/15', text: 'text-status-green', border: 'border-status-green/30' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-status-red/15', text: 'text-status-red', border: 'border-status-red/30' },
  OPEN: { label: 'Open', bg: 'bg-status-orange/15', text: 'text-status-orange', border: 'border-status-orange/30' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-status-blue/15', text: 'text-status-blue', border: 'border-status-blue/30' },
  CLOSED: { label: 'Closed', bg: 'bg-status-green/15', text: 'text-status-green', border: 'border-status-green/30' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border ${config.bg} ${config.text} ${config.border} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text-', 'bg-')}`}></span>
      {config.label}
    </span>
  );
}
