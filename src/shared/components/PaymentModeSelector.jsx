import { useRef } from 'react';
import { Field } from './FormControls.jsx';

export const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'];

// Segmented radio group. ←/→ changes the selection.
export default function PaymentModeSelector({ value, onChange, error, label = 'Payment Mode', className = '' }) {
  const refs = useRef([]);

  const onKeyDown = (e, i) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + PAYMENT_MODES.length) % PAYMENT_MODES.length;
    onChange(PAYMENT_MODES[next]);
    refs.current[next]?.focus();
  };

  return (
    <Field label={label} required error={error} className={className}>
      <div
        role="radiogroup"
        aria-label={label}
        className={`inline-flex max-w-full flex-wrap border ${error ? 'border-rose-500' : 'border-slate-400'}`}
      >
        {PAYMENT_MODES.map((m, i) => {
          const on = m === value;
          const tabStop = on || (!value && i === 0); // roving tabindex
          return (
            <button
              key={m}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={tabStop ? 0 : -1}
              data-enter={tabStop ? '' : undefined}
              onClick={() => onChange(m)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`h-8 border-r border-slate-300 px-3 text-xs font-medium last:border-r-0 focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-600/50 ${
                on ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
