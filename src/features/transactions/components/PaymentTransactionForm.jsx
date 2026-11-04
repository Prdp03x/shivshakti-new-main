import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import TransactionEntryLayout from '../../../shared/components/TransactionEntryLayout.jsx';
import EntryPageHeader from '../../../shared/components/EntryPageHeader.jsx';
import PartySelector from '../../../shared/components/PartySelector.jsx';
import PaymentModeSelector from '../../../shared/components/PaymentModeSelector.jsx';
import TransactionSummary from '../../../shared/components/TransactionSummary.jsx';
import DemoSuccessModal from '../../../shared/components/DemoSuccessModal.jsx';
import { Field, FormSection, inputClass } from '../../../shared/components/FormControls.jsx';
import useGoBack from '../../../shared/hooks/useGoBack.js';
import { api } from '../../../api/client.js';
import { todayISO, formatBalance, formatDate, formatMoney, toNum } from '../../../shared/utils/format.js';
import TransactionBadge from './TransactionBadge.jsx';

/**
 * ONE payment-based entry form, used by both
 *   New Sale      (payment made to a supplier, supplier ledger Debit)
 *   Credit Entry  (payment received from a customer, customer ledger Credit)
 * Payments never touch stock. Only `config` (see transactionTypes.js) differs.
 */
export default function PaymentTransactionForm({ config, onReset }) {
  const navigate = useNavigate();
  const goBack = useGoBack();

  const [party, setParty] = useState(null);
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(todayISO);
  const [refNo, setRefNo] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(null);

  // Suggest the next voucher number from the server (editable).
  useEffect(() => {
    api
      .get(`/transactions/next-voucher?type=${config.type}`)
      .then((r) => setRefNo((cur) => cur || r.voucherNo))
      .catch(() => {});
  }, [config.type]);

  const validate = () => {
    const e = {};
    if (!party) e.party = `Select a ${config.partyType}`;
    if (!date) e.date = 'Required';
    if (!refNo.trim()) e.refNo = 'Required';
    if (!(toNum(amount) > 0)) e.amount = 'Enter an amount greater than 0';
    if (!mode) e.mode = 'Select a payment mode';
    return e;
  };
  const errors = submitted ? validate() : {};
  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError('');
    if (Object.keys(validate()).length > 0) return;
    setSaving(true);
    try {
      const res = await api.post('/transactions', {
        type: config.type,
        partyId: party.id,
        date,
        voucherNo: refNo.trim(),
        amount: toNum(amount),
        paymentMode: mode,
        notes,
      });
      setSaved(res);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onPartyChange = (p) => {
    setParty(p);
    setPhone(p?.phone ?? '');
  };

  return (
    <>
      <TransactionEntryLayout
        onSubmit={onSubmit}
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
              { label: 'Party', value: party?.name ?? '—' },
              { label: 'Payment Mode', value: mode || '—' },
              { label: 'Ledger', value: config.ledgerLabel },
              { label: 'Stock', value: config.stockLabel },
            ]}
            totalLabel={config.totalLabel}
            totalValue={formatMoney(amount)}
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

        <FormSection title={config.detailsTitle}>
          <div className="grid gap-x-4 gap-y-3 p-3 md:grid-cols-2">
            <PartySelector
              partyType={config.partyType}
              label={config.partyLabel}
              value={party?.id ?? null}
              onChange={onPartyChange}
              error={errors.party}
              className="md:col-span-2"
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

            <Field label={config.amountLabel} required error={errors.amount} htmlFor="amount">
              <input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className={`${inputClass(errors.amount)} text-right text-sm font-semibold tabular-nums`}
              />
            </Field>

            <PaymentModeSelector value={mode} onChange={setMode} error={errors.mode} className="md:col-span-2" />

            <Field label="Description / Notes" htmlFor="notes" className="md:col-span-2">
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
                className="w-full border border-slate-400 bg-white px-2 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </Field>
          </div>
        </FormSection>
      </TransactionEntryLayout>

      <DemoSuccessModal
        open={!!saved}
        title={config.successTitle}
        message={config.successMessage}
        details={[
          { label: config.partyType === 'supplier' ? 'Supplier' : 'Customer', value: party?.name },
          { label: config.refLabel, value: saved?.transaction.voucherNo },
          { label: 'Date', value: formatDate(date) },
          { label: 'Payment Mode', value: mode },
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
