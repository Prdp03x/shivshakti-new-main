import { Users, Package, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const icons = {
  parties: Users,
  items: Package,
  receivable: ArrowDownLeft,
  payable: ArrowUpRight,
};

const valueTone = {
  green: 'text-emerald-700',
  red: 'text-rose-700',
};

export default function BusinessSnapshot({ items }) {
  return (
    <section className="border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-slate-700">Business Snapshot</h2>
      </div>
      <ul className="divide-y divide-slate-200">
        {items.map((s) => {
          const Icon = icons[s.icon] ?? Package;
          return (
            <li key={s.id} className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                <Icon size={15} className="text-slate-400" />
                {s.label}
              </div>
              <span className={`text-sm font-semibold tabular-nums ${valueTone[s.tone] ?? 'text-slate-900'}`}>
                {s.value}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
