import React from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';

export default function ViewToggle({ view, onViewChange }) {
  return (
    <div className="inline-flex rounded-sm border border-border bg-background-panel p-0.5 shadow-sm">
      <button
        onClick={() => onViewChange('kanban')}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
          view === 'kanban'
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        }`}
        title="Kanban Board View"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Kanban</span>
      </button>

      <button
        onClick={() => onViewChange('table')}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
          view === 'table'
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        }`}
        title="Data Table View"
      >
        <TableIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
