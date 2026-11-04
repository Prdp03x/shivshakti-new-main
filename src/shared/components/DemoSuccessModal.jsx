import { CheckCircle2 } from 'lucide-react';
import DemoModal from './DemoModal.jsx';
import { primaryBtn, secondaryBtn } from './formStyles.js';

// Confirmation shown after a transaction has been saved.
export default function DemoSuccessModal({
  open,
  title = 'Saved Successfully',
  message,
  details = [],
  footnote,
  anotherLabel = 'New Entry',
  onAnother,
  onDashboard,
}) {
  return (
    <DemoModal
      open={open}
      title={title}
      onClose={onAnother}
      showClose={false}
      footer={
        <>
          <button type="button" onClick={onDashboard} className={secondaryBtn}>
            Go to Dashboard
          </button>
          <button type="button" onClick={onAnother} autoFocus className={primaryBtn}>
            {anotherLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 size={28} className="mt-0.5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{message}</p>
          <dl className="mt-3 grid grid-cols-[130px_1fr] gap-y-1.5 text-[13px]">
            {details.map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-slate-500">{d.label}</dt>
                <dd className="font-medium text-slate-800">{d.value}</dd>
              </div>
            ))}
          </dl>
          {footnote && <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500">{footnote}</p>}
        </div>
      </div>
    </DemoModal>
  );
}
