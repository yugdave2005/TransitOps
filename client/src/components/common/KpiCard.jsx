import React from 'react';

export default function KpiCard({ title, value, icon: Icon, color = 'text-primary', borderLeft = 'border-l-primary' }) {
  return (
    <div className={`bg-background-panel border border-border p-4 rounded-sm shadow-sm border-l-4 ${borderLeft} flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-sm bg-black/5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
