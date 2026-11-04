import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function DemoModal({ open, title, onClose, children, footer, showClose = true, closeLabel = 'Close' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md border border-slate-400 bg-white shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between bg-brand-800 px-3 py-1.5 text-white">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-0.5 hover:bg-white/20" aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="p-4 text-[13px] text-slate-700">{children}</div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          {footer}
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
