import { ShoppingCart, TrendingUp } from 'lucide-react';

const icons = { purchase: ShoppingCart, sale: TrendingUp };
const tones = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function SummaryCard({ label, value, icon, tone = 'green' }) {
  const Icon = icons[icon] ?? TrendingUp;
  return (
    <div className="flex items-center justify-between border border-slate-300 bg-white px-4 py-3">
      <div>
        <div className="text-[11px] font-semibold tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</div>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded border ${tones[tone]}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}
