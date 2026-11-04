import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { secondaryBtn } from './formStyles.js';
import useGoBack from '../hooks/useGoBack.js';

/**
 * title / subtitle, an optional badge next to the title, a breadcrumb
 * (Dashboard › ...crumbs) and a Back button.
 */
export default function EntryPageHeader({ title, subtitle, crumbs = [], badge }) {
  const goBack = useGoBack();
  return (
    <div className="mb-3">
      <nav className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-700 hover:underline">
          Dashboard
        </Link>
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            <span>›</span>
            <span className={i === crumbs.length - 1 ? 'font-semibold text-slate-700' : ''}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {badge}
          </div>
          <p className="text-[13px] text-slate-500">{subtitle}</p>
        </div>
        <button type="button" onClick={goBack} className={`${secondaryBtn} inline-flex items-center gap-1 !px-3`}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>
    </div>
  );
}
