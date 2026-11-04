import { formatINR } from '../data.js';

const badgeStyles = {
  Purchase: 'bg-amber-50 text-amber-800 border-amber-300',
  Sale: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  'Credit Entry': 'bg-blue-50 text-blue-800 border-blue-300',
  'Debit Entry': 'bg-rose-50 text-rose-800 border-rose-300',
};

export function TypeBadge({ type }) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-1.5 py-0.5 text-[11px] font-medium ${
        badgeStyles[type] ?? 'bg-slate-50 text-slate-700 border-slate-300'
      }`}
    >
      {type}
    </span>
  );
}

export default function RecentActivityTable({ rows, onRowClick }) {
  return (
    <section className="border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-slate-700">Recent Activity</h2>
        <span className="text-[11px] text-slate-500">Click a row to preview</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
              <th className="px-3 py-2 font-semibold">Date &amp; Time</th>
              <th className="px-3 py-2 font-semibold">Transaction Type</th>
              <th className="px-3 py-2 font-semibold">Party Name</th>
              <th className="px-3 py-2 font-semibold">Reference No.</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                onClick={() => onRowClick(r)}
                className={`cursor-pointer border-b border-slate-200 hover:bg-brand-50 ${
                  i % 2 ? 'bg-slate-50/60' : 'bg-white'
                }`}
              >
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{r.dateTime}</td>
                <td className="px-3 py-1.5">
                  <TypeBadge type={r.type} />
                </td>
                <td className="px-3 py-1.5 font-medium text-slate-800">{r.party}</td>
                <td className="px-3 py-1.5 font-mono text-xs text-slate-600">{r.ref}</td>
                <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                  {formatINR(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
