import { primaryBtn, secondaryBtn } from './formStyles.js';

export default function TransactionSummary({ rows = [], totalLabel, totalValue, onCancel, saveLabel, saving = false }) {
  return (
    <div className="ml-auto w-full border border-slate-300 bg-white sm:max-w-sm">
      <div className="space-y-1.5 px-4 py-3 text-[13px]">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4">
            <span className="text-slate-500">{r.label}</span>
            <span className="text-right font-medium tabular-nums text-slate-800">{r.value}</span>
          </div>
        ))}
        {rows.length > 0 && <div className="border-t border-slate-300 pt-1" />}
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-semibold text-slate-800">{totalLabel}</span>
          <span className="text-xl font-semibold tabular-nums text-brand-800">{totalValue}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-300 bg-slate-50 px-3 py-2">
        <button type="button" onClick={onCancel} className={secondaryBtn}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={`${primaryBtn} disabled:opacity-60`}>
          {saving ? 'Saving...' : saveLabel}
        </button>
      </div>
    </div>
  );
}
