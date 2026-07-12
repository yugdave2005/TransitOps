import React from 'react';

export default function KpiCard({ title, value, icon: Icon, color = 'text-primary', borderLeft = 'border-l-primary', onClick }) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`bg-background-panel border border-border p-4 rounded-sm shadow-sm border-l-4 ${borderLeft} flex items-center justify-between w-full text-left ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-l-primary transition-all' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{title}</p>
        <p className="text-xl font-bold text-text-primary mt-1 truncate">{value}</p>
      </div>
      {Icon && (
        <div className={`p-2 rounded bg-black/[0.04] ${color} flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </Wrapper>
  );
}
