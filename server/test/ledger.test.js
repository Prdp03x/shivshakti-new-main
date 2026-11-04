// Pure ledger-engine tests (no database needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStatement, partyTotals, sortChronological } from '../src/accounting/ledger.js';

const t = (id, type, side, date, amount, extra = {}) => ({
  id,
  type,
  ledgerSide: side,
  date,
  amount,
  voucherNo: id.toUpperCase(),
  accountName: 'X A/c',
  createdAt: `${date}T10:00:00Z`,
  items: [],
  ...extra,
});

const supplier = { id: 's1', name: 'Supplier', phone: '', type: 'supplier', openingBalance: 0 };
const customer = { id: 'c1', name: 'Customer', phone: '', type: 'customer', openingBalance: 0 };

test('supplier ledger: credit raises what is owed, debit lowers it', () => {
  const txns = [t('pur-1', 'purchase', 'credit', '2026-11-01', 12000), t('sal-1', 'sale', 'debit', '2026-11-02', 5000)];
  const s = buildStatement({ party: supplier, txns });
  assert.deepEqual(s.rows.map((r) => [r.credit, r.debit, r.closing.amount, r.closing.sideCode]), [
    [12000, 0, 12000, 'Cr'],
    [0, 5000, 7000, 'Cr'],
  ]);
  assert.equal(s.closing.amount, 7000);
  assert.deepEqual(s.totals, { credit: 12000, debit: 5000 });
});

test('customer ledger: debit raises what the customer owes, credit lowers it', () => {
  const txns = [t('dr-1', 'debit', 'debit', '2026-11-01', 16800), t('cr-1', 'credit', 'credit', '2026-11-02', 15000)];
  const s = buildStatement({ party: customer, txns });
  assert.deepEqual(s.rows.map((r) => [r.closing.amount, r.closing.sideCode]), [[16800, 'Dr'], [1800, 'Dr']]);
  assert.equal(partyTotals(customer, txns).closing.amount, 1800);
});

test('over-payment flips the balance to the opposite side', () => {
  const txns = [t('pur-1', 'purchase', 'credit', '2026-11-01', 6000), t('sal-1', 'sale', 'debit', '2026-11-02', 10000)];
  const s = buildStatement({ party: supplier, txns });
  assert.equal(s.closing.amount, 4000);
  assert.equal(s.closing.sideCode, 'Dr');
  assert.equal(s.closing.signed, -4000);
});

test('entries are ordered chronologically regardless of insertion order', () => {
  const txns = [t('b', 'purchase', 'credit', '2026-11-03', 1), t('a', 'purchase', 'credit', '2026-11-01', 1), t('c', 'purchase', 'credit', '2026-11-02', 1)];
  assert.deepEqual(sortChronological(txns).map((x) => x.id), ['a', 'c', 'b']);
});

test('same-day entries keep creation order', () => {
  const a = t('a', 'purchase', 'credit', '2026-11-01', 1, { createdAt: '2026-11-01T09:00:00Z' });
  const b = t('b', 'sale', 'debit', '2026-11-01', 1, { createdAt: '2026-11-01T15:00:00Z' });
  assert.deepEqual(sortChronological([b, a]).map((x) => x.id), ['a', 'b']);
});

test('opening balance and date-range filter: opening carries earlier entries', () => {
  const party = { ...customer, openingBalance: 5000 };
  const txns = [t('dr-1', 'debit', 'debit', '2026-10-30', 1000), t('cr-1', 'credit', 'credit', '2026-11-02', 2000)];
  const all = buildStatement({ party, txns });
  assert.equal(all.opening.amount, 5000);
  assert.equal(all.closing.amount, 4000);
  const ranged = buildStatement({ party, txns, from: '2026-11-01' });
  assert.equal(ranged.opening.amount, 6000); // 5000 + 1000 before the range
  assert.equal(ranged.rows.length, 1);
  assert.equal(ranged.closing.amount, 4000); // same true closing
  const cut = buildStatement({ party, txns, to: '2026-10-31' });
  assert.equal(cut.closing.amount, 6000);
});

test('type and search filters hide rows but never change running balances', () => {
  const txns = [
    t('dr-1', 'debit', 'debit', '2026-11-01', 1000, { items: [{ name: 'Cement' }] }),
    t('cr-1', 'credit', 'credit', '2026-11-02', 400, { paymentMode: 'UPI' }),
    t('dr-2', 'debit', 'debit', '2026-11-03', 100),
  ];
  const onlyCredit = buildStatement({ party: customer, txns, type: 'credit' });
  assert.equal(onlyCredit.rows.length, 1);
  assert.equal(onlyCredit.rows[0].closing.amount, 600); // true running balance after DR-1 and CR-1
  assert.deepEqual(onlyCredit.totals, { credit: 400, debit: 0 });
  assert.equal(onlyCredit.closing.amount, 700); // true closing includes DR-2
  assert.equal(buildStatement({ party: customer, txns, q: 'cement' }).rows.length, 1);
  assert.equal(buildStatement({ party: customer, txns, q: 'dr-' }).rows.length, 2);
});

test('amounts are summed in paise: 0.1 + 0.2 is exactly 0.3', () => {
  const txns = [t('a', 'purchase', 'credit', '2026-11-01', 0.1), t('b', 'purchase', 'credit', '2026-11-01', 0.2, { createdAt: '2026-11-01T11:00:00Z' })];
  const s = buildStatement({ party: supplier, txns });
  assert.equal(s.closing.amount, 0.3);
  assert.equal(s.totals.credit, 0.3);
});
