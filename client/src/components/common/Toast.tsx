import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message?: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => {
          let border = 'border-[#E6E0D6]';
          let icon = <Info className="w-5 h-5 text-[#244A3D]" />;
          let bg = 'bg-white';

          if (t.type === 'success') {
            border = 'border-[#BCE0C3]';
            icon = <CheckCircle2 className="w-5 h-5 text-[#2E6F40]" />;
            bg = 'bg-[#F9FCF9]';
          } else if (t.type === 'error') {
            border = 'border-[#E8B6B6]';
            icon = <AlertCircle className="w-5 h-5 text-[#A94442]" />;
            bg = 'bg-[#FCF7F7]';
          } else if (t.type === 'warning') {
            border = 'border-[#F0DCBA]';
            icon = <AlertCircle className="w-5 h-5 text-[#B47D28]" />;
            bg = 'bg-[#FDFBF7]';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border ${border} ${bg} shadow-md transition-all animate-in fade-in duration-200`}
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#292D2B] leading-tight">{t.title}</p>
                {t.message && <p className="text-xs text-[#77766F] mt-1 leading-normal">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#9C9A93] hover:text-[#292D2B] p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
