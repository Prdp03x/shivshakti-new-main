import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import EntryPageHeader from '../../../shared/components/EntryPageHeader.jsx';
import { inputClass } from '../../../shared/components/FormControls.jsx';
import { secondaryBtn } from '../../../shared/components/formStyles.js';
import { TypeBadge } from '../../dashboard/components/RecentActivityTable.jsx';
import { api, qs } from '../../../api/client.js';
import { formatBalance, formatDate, formatMoney } from '../../../shared/utils/format.js';
import { LEDGERS } from '../ledgerConfig.js';
import PrintSizeControl from '../../../shared/print/PrintSizeControl.jsx';
import { exportStatementCsv } from '../exportLedger.js';
import LedgerPrint from '../../../shared/print/LedgerPrint.jsx';

const EMPTY = { from: '', to: '', type: '', q: '' };
const amt = (n) => (n ? formatMoney(n) : '');

/**
 * ONE statement component for both ledgers (Customer Ledger and Owner's Ledger).
 * Filters run on the server, which returns the TRUE running balance on every row
 * (filtering never changes a balance). Print and CSV export use the filtered rows.
 */
export default function LedgerStatement({ kind }) {
  const cfg = LEDGERS[kind];
  const { partyId } = useParams();
  const [filters, setFilters] = useState(EMPTY);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t = setTimeout(
      () => {
        api
          .get(`/ledger/${kind}/${partyId}${qs(filters)}`)
          .then((d) => {
            if (!live) return;
            setData(d);
            setError('');
          })
          .catch((e) => live && setError(e.message))
          .finally(() => live && setLoading(false));
      },
      filters.q ? 250 : 0 // debounce typing in the search box
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [kind, partyId, filters]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const filtered = Object.values(filters).some(Boolean);
  const periodText = `${filters.from ? formatDate(filters.from) : 'Start'} to ${filters.to ? formatDate(filters.to) : 'Today'}`;

  return (
    <div className="print-target-page mx-auto max-w-6xl">
      <div className="print:hidden">
        <EntryPageHeader
          title={data ? data.party.name : cfg.title}
          subtitle={data ? `${cfg.title} · Statement of account${data.party.phone ? ` · ${data.party.phone}` : ''}` : 'Loading...'}
          crumbs={['Ledger', cfg.title, data?.party.name ?? '...']}
        />
      </div>

      {/* Printed header (hidden on screen) */}
      {data && (
        <div className="mb-3 hidden print:block">
          <h1 className="text-lg font-bold">Shivshakti Billing System</h1>
          <p className="text-sm">
            {cfg.title} — {data.party.name} {data.party.phone && `(${data.party.phone})`}
          </p>
          <p className="text-xs">
            Period: {periodText}
            {filters.type && ` · Type: ${filters.type}`}
            {filters.q && ` · Search: "${filters.q}"`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-end gap-x-3 gap-y-2 border border-slate-300 bg-white p-3 print:hidden">
        <label className="text-xs font-medium text-slate-600">
          From
          <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} className={`${inputClass()} mt-1 w-40`} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          To
          <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} className={`${inputClass()} mt-1 w-40`} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Transaction Type
          <select value={filters.type} onChange={(e) => set({ type: e.target.value })} className={`${inputClass()} mt-1 w-44`}>
            <option value="">All types</option>
            {cfg.typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[180px] flex-1 text-xs font-medium text-slate-600">
          Search
          <input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Voucher no., account, item, notes..."
            className={`${inputClass()} mt-1`}
          />
        </label>
        <div className="ml-auto flex gap-2">
          {filtered && (
            <button type="button" onClick={() => setFilters(EMPTY)} className={`${secondaryBtn} inline-flex h-8 items-center gap-1`}>
              <X size={13} /> Clear
            </button>
          )}
          <PrintSizeControl target="ledger" label="Print Statement" usePrinterDefault disabled={!data} />
          <button
            type="button"
            disabled={!data}
            onClick={() => exportStatementCsv(data, cfg.title)}
            className={`${secondaryBtn} inline-flex h-8 items-center gap-1 disabled:opacity-50`}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

      {data && (
        <section className={`border border-slate-300 bg-white ${loading ? 'opacity-70' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-50 px-3 py-2 text-[13px] print:hidden">
            <span className="font-semibold text-slate-700">
              Statement · {periodText}
            </span>
            <span className="text-slate-500">
              {data.count} {data.count === 1 ? 'entry' : 'entries'}
              {filtered && ' (filtered)'}
            </span>
          </div>

          {/* Header and totals stay fixed while the entries scroll */}
          <div className="max-h-[calc(100vh-24rem)] min-h-[200px] overflow-auto print:max-h-none print:overflow-visible">
            <table className="w-full min-w-[860px] border-collapse text-[13px] print:min-w-0 print:text-[11px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-300 bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Transaction Type</th>
                  <th className="px-3 py-2 font-semibold">Voucher / Bill Number</th>
                  <th className="px-3 py-2 font-semibold">Account Name</th>
                  <th className="px-3 py-2 text-right font-semibold">Credit</th>
                  <th className="px-3 py-2 text-right font-semibold">Debit</th>
                  <th className="px-3 py-2 text-right font-semibold">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 bg-amber-50/60 text-slate-600">
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5 italic" colSpan={5}>
                    Opening Balance{filters.from ? ` (as on ${formatDate(filters.from)})` : ''}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">{formatBalance(data.opening)}</td>
                </tr>
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      No transactions match these filters.
                    </td>
                  </tr>
                )}
                {data.rows.map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-200 ${i % 2 ? 'bg-slate-50/60' : 'bg-white'}`}>
                    <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-3 py-1.5">
                      <TypeBadge type={r.typeLabel} />
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-slate-700">{r.voucherNo}</td>
                    <td className="px-3 py-1.5 text-slate-700">{r.accountName}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-emerald-800">{amt(r.credit)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-rose-800">{amt(r.debit)}</td>
                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">{formatBalance(r.closing)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-10">
                <tr className="border-t-2 border-slate-400 bg-slate-100 font-semibold">
                  <td className="px-3 py-2" colSpan={4}>
                    Total{filtered ? ' (filtered entries)' : ''}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(data.totals.credit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(data.totals.debit)}</td>
                  <td className="px-3 py-2" />
                </tr>
                <tr className="bg-brand-800 text-white print:border-t-2 print:border-black print:bg-white print:text-black">
                  <td className="px-3 py-2 font-semibold" colSpan={6}>
                    Closing Balance{filters.to ? ` (as on ${formatDate(filters.to)})` : ''}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums">{formatBalance(data.closing)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500 print:hidden">{cfg.balanceHint}</div>
        </section>
      )}
      <LedgerPrint data={data} filters={filters} title={cfg.title} />
    </div>
  );
}
