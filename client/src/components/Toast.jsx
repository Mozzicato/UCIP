import { createContext, useCallback, useContext, useState } from 'react';
import Icon from './Icon.jsx';

const ToastCtx = createContext(null);

const TONE = {
  success: { icon: 'sparkles', cls: 'border-success/40 bg-success/10 text-success' },
  error:   { icon: 'alert',    cls: 'border-danger/40  bg-danger/10  text-danger' },
  warn:    { icon: 'bell',     cls: 'border-warn/40    bg-warn/10    text-warn'   },
  info:    { icon: 'pulse',    cls: 'border-flood-bright/40 bg-flood-bright/10 text-flood-bright' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, tone: opts.tone || 'success', title: opts.title }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => {
          const tone = TONE[t.tone] || TONE.success;
          return (
            <div key={t.id}
              className={`pointer-events-auto surface-raised px-4 py-3.5 flex items-start gap-3 animate-slide-in-r border shadow-lift`}>
              <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl grid place-items-center ${tone.cls.split(' ')[1]} ${tone.cls.split(' ')[2]}`}>
                <Icon name={tone.icon} size={18} />
              </div>
              <div className="min-w-0">
                {t.title && <div className="text-sm font-semibold text-ink-50">{t.title}</div>}
                <div className="text-sm text-ink-200">{t.msg}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
