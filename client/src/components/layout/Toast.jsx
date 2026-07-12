import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Fixed Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const config = {
            success: { bg: 'bg-status-green/10 border-status-green', text: 'text-status-green', icon: CheckCircle2 },
            error: { bg: 'bg-status-red/10 border-status-red', text: 'text-status-red', icon: AlertCircle },
            warning: { bg: 'bg-status-orange/10 border-status-orange', text: 'text-status-orange', icon: AlertCircle },
            info: { bg: 'bg-primary/10 border-primary', text: 'text-primary', icon: Info }
          }[t.type] || { bg: 'bg-white border-border', text: 'text-text-primary', icon: Info };

          const Icon = config.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto border rounded-sm p-3.5 shadow-lg bg-background-panel flex items-start space-x-3 transition-all transform animate-slideUp ${config.bg}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${config.text} mt-0.5`} />
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-xs font-bold text-text-primary">{t.title}</h4>}
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
