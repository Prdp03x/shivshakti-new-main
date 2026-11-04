import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, group }) {
  return (
    <div className="border border-slate-300 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
        {group ? `${group} › ` : ''}
        <span className="font-semibold text-slate-700">{title}</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-center">
        <Construction size={32} className="text-slate-400" />
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        <p className="max-w-sm text-[13px] text-slate-500">
          This module is not part of the demo yet. It will be built on top of this layout.
        </p>
        <Link
          to="/"
          className="mt-2 border border-brand-600 bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
