import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import TransactionEntryLayout from '../../../shared/components/TransactionEntryLayout.jsx';
import EntryPageHeader from '../../../shared/components/EntryPageHeader.jsx';
import PartySelector from '../../../shared/components/PartySelector.jsx';
import TransactionSummary from '../../../shared/components/TransactionSummary.jsx';
import DemoSuccessModal from '../../../shared/components/DemoSuccessModal.jsx';
import { Field, FormSection, inputClass } from '../../../shared/components/FormControls.jsx';
import useGoBack from '../../../shared/hooks/useGoBack.js';
import useItems from '../../../shared/hooks/useItems.js';
import { api } from '../../../api/client.js';
import { todayISO, formatBalance, formatMoney, formatQty, formatDate, toNum } from '../../../shared/utils/format.js';
import ItemTransactionTable from './ItemTransactionTable.jsx';
import TransactionBadge from './TransactionBadge.jsx';

/**
 * ONE item-based entry form, used by both
 *   Purchase     (supplier party, stock increases)
 *   Debit Entry  (customer party, stock decreases)
 * Only `config` (see transactionTypes.js) differs. The server applies the ledger
 * and stock rules; this form just collects the data.
 */
export default function ItemTransactionForm({ config, onReset }) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { items } = useItems();
  const nextId = useRef(1);
  const newRow = () => ({ id: `row-${nextId.current++}`, itemId: '', qty: '', price: '' });

  const [party, setParty] = useState(null);
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(todayISO);
  const [refNo, setRefNo] = useState('');
  const [rows, setRows] = useState(() => [newRow()]);
  const [focusRowId, setFocusRowId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(null); // server response after a successful save

  // Suggest the next voucher number from the server (editable).
  useEffect(() => {
    api
      .get(`/transactions/next-voucher?type=${config.type}`)
      .then((r) => setRefNo((cur) => cur || r.voucherNo))
      .catch(() => {});
  }, [config.type]);

  const clearFocus = useCallback(() => setFocusRowId(null), []);
  const updateRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const selectItem = (id, itemId) => {
    const item = items.find((i) => i.id === itemId);
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, itemId, price: r.price === '' && item ? String(config.type === 'debit' ? (item.saleRate || item.price) : (item.purchaseRate || item.price)) : r.price } : r))
    );
  };

  const addRow = () => {
    const r = newRow();
    setRows((rs) => [...rs, r]);
    setFocusRowId(r.id);
  };
  const removeRow = (id) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  const onPartyChange = (p) => {
    setParty(p);
    setPhone(p?.phone ?? '');
  };

  // Totals
  const filledRows = rows.filter((r) => r.itemId);
  const totalItems = filledRows.length;
  const totalQty = filledRows.reduce((s, r) => s + toNum(r.qty), 0);
  const totalAmount = rows.reduce((s, r) => s + toNum(r.qty) * toNum(r.price), 0);

  const validate = () => {
    const e = { rows: {} };
    if (!party) e.party = `Select a ${config.partyType}`;
    if (!date) e.date = 'Required';
    if (!refNo.trim()) e.refNo = 'Required';

    // When stock decreases, the quantity per item (across all rows) must be available.
    const wanted = {};
    rows.forEach((r) => r.itemId && (wanted[r.itemId] = (wanted[r.itemId] ?? 0) + toNum(r.qty)));

    rows.forEach((r) => {
      const re = {};
      if (!r.itemId) re.item = 'Select an item';
      if (!(toNum(r.qty) > 0)) re.qty = 'Required';
      if (!(toNum(r.price) > 0)) re.price = 'Required';
      if (config.stockEffect === 'decrease' && r.itemId) {
        const stock = items.find((i) => i.id === r.itemId)?.stock ?? 0;
        if (wanted[r.itemId] > stock) re.qty = `Only ${formatQty(stock)} in stock`;
      }
      if (Object.keys(re).length) e.rows[r.id] = re;
    });
    if (Object.keys(e.rows).length) e.items = 'Complete every item row, or remove the empty ones.';
    return e;
  };

  const errors = submitted ? validate() : { rows: {} };
  const hasErrors = submitted && (Object.keys(errors).length > 1 || Object.keys(errors.rows).length > 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError('');
    const v = validate();
    if (Object.keys(v).length > 1 || Object.keys(v.rows).length > 0) return;
    setSaving(true);
    try {
      const res = await api.post('/transactions', {
        type: config.type,
        partyId: party.id,
        date,
        voucherNo: refNo.trim(),
        items: rows.map((r) => ({ itemId: r.itemId, qty: toNum(r.qty), rate: toNum(r.price) })),
      });
      setSaved(res);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TransactionEntryLayout
        onSubmit={onSubmit}
        summaryPlacement="bottom"
        header={
          <EntryPageHeader
            title={config.title}
            subtitle={config.subtitle}
            crumbs={config.crumbs}
            badge={<TransactionBadge badge={config.badge} />}
          />
        }
        summary={
          <TransactionSummary
            rows={[
              { label: 'Total Items', value: totalItems },
              { label: 'Total Quantity', value: formatQty(totalQty) },
              { label: 'Ledger', value: config.ledgerLabel },
              { label: 'Stock', value: config.stockLabel },
            ]}
            totalLabel={config.totalLabel}
            totalValue={formatMoney(totalAmount)}
            onCancel={goBack}
            saveLabel={config.saveLabel}
            saving={saving}
          />
        }
      >
        {(hasErrors || serverError) && (
          <div role="alert" className="flex items-center gap-2 border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle size={14} />
            {serverError || 'Please fix the highlighted fields before saving.'}
          </div>
        )}

        <FormSection title={`${config.title.replace(' Entry', '')} Information`}>
          <div className="grid gap-x-4 gap-y-3 p-3 md:grid-cols-2 xl:grid-cols-4">
            <PartySelector
              partyType={config.partyType}
              label={config.partyLabel}
              value={party?.id ?? null}
              onChange={onPartyChange}
              error={errors.party}
              className="md:col-span-2 xl:col-span-2"
            />
            <Field label="Phone Number" htmlFor="phone">
              <input
                id="phone"
                value={phone}
                readOnly
                tabIndex={-1}
                placeholder="Filled from the party"
                className={`${inputClass()} bg-slate-50 text-slate-600`}
              />
            </Field>
            <Field label={config.dateLabel} required error={errors.date} htmlFor="date">
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass(errors.date)} />
            </Field>
            <Field label={config.refLabel} required error={errors.refNo} htmlFor="refNo">
              <input id="refNo" value={refNo} onChange={(e) => setRefNo(e.target.value)} className={inputClass(errors.refNo)} />
            </Field>
          </div>
        </FormSection>

        <ItemTransactionTable
          title={config.itemsTitle}
          priceLabel={config.priceLabel}
          items={items}
          showStock={config.stockEffect === 'decrease'}
          rows={rows}
          rowErrors={errors.rows}
          itemsError={errors.items}
          onSelectItem={selectItem}
          onChange={updateRow}
          onAdd={addRow}
          onRemove={removeRow}
          focusRowId={focusRowId}
          onFocusDone={clearFocus}
        />
      </TransactionEntryLayout>

      <DemoSuccessModal
        open={!!saved}
        title={config.successTitle}
        message={config.successMessage}
        details={[
          { label: config.partyType === 'supplier' ? 'Supplier' : 'Customer', value: party?.name },
          { label: config.refLabel, value: saved?.transaction.voucherNo },
          { label: 'Date', value: formatDate(date) },
          { label: 'Items / Quantity', value: `${totalItems} / ${formatQty(totalQty)}` },
          { label: config.totalLabel, value: formatMoney(saved?.transaction.amount) },
          { label: config.balanceLabel, value: saved ? formatBalance(saved.partyBalance) : '' },
        ]}
        footnote={`${config.ledgerLabel} posted · Stock: ${config.stockLabel.toLowerCase()}`}
        onAnother={onReset}
        onDashboard={() => navigate('/')}
      />
    </>
  );
}
