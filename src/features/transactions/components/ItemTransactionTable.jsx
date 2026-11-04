import { useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../../shared/components/SearchableSelect.jsx';
import { FormSection, inputClass } from '../../../shared/components/FormControls.jsx';
import { formatMoney, formatQty, toNum } from '../../../shared/utils/format.js';

const numeric = (v) => v.replace(/[^0-9.]/g, '');

/**
 * Item grid shared by Purchase and Debit Entry.
 *   items:     [{ id, name, unit, price, stock }] from the API
 *   showStock: show available stock next to each item (used when stock decreases)
 */
export default function ItemTransactionTable({
  title,
  priceLabel,
  items,
  showStock,
  rows,
  rowErrors,
  itemsError,
  onSelectItem,
  onChange,
  onAdd,
  onRemove,
  focusRowId,
  onFocusDone,
}) {
  const tableRef = useRef(null);
  const options = useMemo(
    () =>
      items.map((i) => ({
        value: i.id,
        label: i.name,
        hint: showStock ? `${i.unit} · ${formatQty(i.stock)} in stock` : i.unit,
      })),
    [items, showStock]
  );

  // After adding a row, move focus to its item field.
  useEffect(() => {
    if (!focusRowId) return;
    tableRef.current?.querySelector(`[data-row="${focusRowId}"] input`)?.focus();
    onFocusDone();
  }, [focusRowId, onFocusDone]);

  return (
    <FormSection title={title}>
      <div ref={tableRef} className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
              <th className="px-3 py-2 font-semibold">Item Name</th>
              <th className="w-24 px-3 py-2 font-semibold">Unit</th>
              <th className="w-28 px-3 py-2 text-right font-semibold">Quantity</th>
              <th className="w-36 px-3 py-2 text-right font-semibold">{priceLabel}</th>
              <th className="w-36 px-3 py-2 text-right font-semibold">Total</th>
              <th className="w-14 px-3 py-2 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const item = items.find((i) => i.id === r.itemId);
              const err = rowErrors[r.id] ?? {};
              const total = toNum(r.qty) * toNum(r.price);
              return (
                <tr key={r.id} className={`border-b border-slate-200 align-top ${idx % 2 ? 'bg-slate-50/60' : 'bg-white'}`}>
                  <td className="px-3 py-1.5">
                    <SearchableSelect
                      rowAttr={r.id}
                      options={options}
                      value={r.itemId || null}
                      error={err.item}
                      placeholder="Search item..."
                      onChange={(v) => onSelectItem(r.id, v)}
                    />
                    {err.item && <p className="mt-1 text-[11px] text-rose-600">{err.item}</p>}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex h-8 items-center text-slate-700">{item?.unit ?? <span className="text-slate-400">—</span>}</div>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      aria-label="Quantity"
                      inputMode="decimal"
                      value={r.qty}
                      onChange={(e) => onChange(r.id, { qty: numeric(e.target.value) })}
                      placeholder="0"
                      className={`${inputClass(err.qty)} text-right tabular-nums`}
                    />
                    {err.qty && <p className="mt-1 text-right text-[11px] text-rose-600">{err.qty}</p>}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      aria-label={priceLabel}
                      inputMode="decimal"
                      value={r.price}
                      onChange={(e) => onChange(r.id, { price: numeric(e.target.value) })}
                      onKeyDown={(e) => {
                        // Enter in the last row's price starts a new row.
                        if (e.key === 'Enter' && idx === rows.length - 1) {
                          e.preventDefault();
                          onAdd();
                        }
                      }}
                      placeholder="0.00"
                      className={`${inputClass(err.price)} text-right tabular-nums`}
                    />
                    {err.price && <p className="mt-1 text-right text-[11px] text-rose-600">{err.price}</p>}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <div className="flex h-8 items-center justify-end font-semibold tabular-nums text-slate-900">
                      {formatMoney(total)}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(r.id)}
                      disabled={rows.length === 1}
                      aria-label="Remove item row"
                      title={rows.length === 1 ? 'At least one row is required' : 'Remove row'}
                      className="inline-flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2">
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 items-center gap-1 border border-slate-400 bg-white px-3 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          <Plus size={13} /> Add Item
        </button>
        {itemsError ? (
          <span className="text-[11px] text-rose-600">{itemsError}</span>
        ) : (
          <span className="hidden text-[11px] text-slate-500 sm:inline">Tip: press Enter in the last price field to add a row</span>
        )}
      </div>
    </FormSection>
  );
}
