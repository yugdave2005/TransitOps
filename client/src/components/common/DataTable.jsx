import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No records available.',
  rowsPerPageOptions = [10, 25, 50]
}) {
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0] || 10);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortField, sortOrder]);

  // Pagination
  const totalRows = sortedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allKeys = new Set(paginatedData.map(row => row[keyField]));
      setSelectedKeys(allKeys);
      if (onSelectionChange) onSelectionChange(Array.from(allKeys));
    } else {
      setSelectedKeys(new Set());
      if (onSelectionChange) onSelectionChange([]);
    }
  };

  const handleSelectRow = (key) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
    if (onSelectionChange) onSelectionChange(Array.from(next));
  };

  return (
    <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-background-muted/90 text-text-secondary uppercase tracking-wider font-semibold border-b border-border select-none">
            <tr>
              {selectable && (
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(row => selectedKeys.has(row[keyField]))}
                    onChange={handleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.field)}
                  className={`py-3 px-4 ${col.sortable ? 'cursor-pointer hover:bg-black/5' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                >
                  <div className={`inline-flex items-center space-x-1 ${col.align === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <span>{col.header}</span>
                    {col.sortable && sortField === col.field && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-12 text-center text-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowKey = row[keyField];
                const isSelected = selectedKeys.has(rowKey);
                return (
                  <tr
                    key={rowKey}
                    className={`hover:bg-black/[0.015] transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    {selectable && (
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowKey)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                      </td>
                    )}
                    {columns.map((col, idx) => (
                      <td key={idx} className={`py-2.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                        {col.render ? col.render(row) : row[col.field] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="px-4 py-2.5 bg-background-page border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-border rounded px-2 py-1 bg-white text-text-primary focus:outline-none focus:border-primary"
          >
            {rowsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4 font-mono">
          <span>
            {totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 border border-border rounded bg-white hover:bg-black/5 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border border-border rounded bg-white hover:bg-black/5 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
