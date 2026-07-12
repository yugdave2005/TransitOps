import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
      <div className={`bg-background-panel border border-border rounded-sm shadow-xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Odoo Modal Header (#714B67 top bar border or subtle grey) */}
        <div className="px-5 py-3.5 border-b border-border bg-background-page flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 text-text-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
