import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import EntryPageHeader from '../../../shared/components/EntryPageHeader.jsx';
import { inputClass } from '../../../shared/components/FormControls.jsx';
import { api } from '../../../api/client.js';
import { formatBalance, formatMoney } from '../../../shared/utils/format.js';
import { LEDGERS } from '../ledgerConfig.js';

const money = (n) => (n ? formatMoney(n) : <span className="text-slate-400">—</span>);

/**
 * Summary table of every party in one ledger (Customer Ledger or Owner's Ledger).
 * Clicking a row opens that party's statement.
 */
export default function LedgerSummaryTable({ kind }) {
  const cfg = LEDGERS[kind];
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let live = true;
    setData(null);
    api
      .get(`/ledger/${kind}`)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [kind]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.rows ?? []).filter((r) => !s || r.name.toLowerCase().includes(s) || (r.phone ?? '').includes(s));
  }, [data, q]);

  const open = (r) => navigate(`${cfg.basePath}/${r.id}`);
  const totalCol = { debit: ['Total Debit', 'totalDebit'], credit: ['Total Credit', 'totalCredit'] };

  return (
    <div className="mx-auto max-w-5xl">
      <EntryPageHeader title={cfg.title} subtitle={cfg.subtitle} crumbs={['Ledger', cfg.title]} />

      <section className="border border-slate-300 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-50 px-3 py-2">
          <div className="text-[13px] font-semibold text-slate-700">
            {cfg.title} <span className="font-normal text-slate-500">· click a row to open the statement</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or phone..."
              aria-label="Search parties"
              className={`${inputClass()} pl-7`}
            />
          </div>
        </div>

        {error ? (
          <div className="px-3 py-6 text-center text-[13px] text-rose-600">{error}</div>
        ) : !data ? (
          <div className="px-3 py-6 text-center text-[13px] text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2 font-semibold">{cfg.nameLabel}</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  {cfg.totalsOrder.map((s) => (
                    <th key={s} className="px-3 py-2 text-right font-semibold">
                      {totalCol[s][0]}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No parties found.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => open(r)}
                    onKeyDown={(e) => e.key === 'Enter' && open(r)}
                    className={`cursor-pointer border-b border-slate-200 hover:bg-brand-50 focus:bg-brand-50 focus:outline-none ${
                      i % 2 ? 'bg-slate-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="px-3 py-1.5 font-medium text-brand-700">{r.name}</td>
                    <td className="px-3 py-1.5 text-slate-600">{r.phone || '—'}</td>
                    {cfg.totalsOrder.map((s) => (
                      <td key={s} className="px-3 py-1.5 text-right tabular-nums text-slate-800">
                        {money(r[totalCol[s][1]])}
                      </td>
                    ))}
                    <td
                      className={`px-3 py-1.5 text-right font-semibold tabular-nums ${
                        r.closing.amount === 0 ? 'text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {formatBalance(r.closing)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-400 bg-slate-100 font-semibold">
                  <td className="px-3 py-2" colSpan={2}>
                    Total ({data.rows.length} parties)
                  </td>
                  {cfg.totalsOrder.map((s) => (
                    <td key={s} className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(data.totals[s])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums text-brand-800">{formatMoney(data.totals.outstanding)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">{cfg.balanceHint}</div>
      </section>
    </div>
  );
}
