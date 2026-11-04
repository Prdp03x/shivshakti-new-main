/**
 * Pure ledger engine (no database access) — everything is computed in integer
 * paise so running balances never drift.
 *
 * Balance convention: a party's balance is positive when it is on the ledger's
 * NORMAL side (supplier: Cr = owner owes; customer: Dr = customer owes) and
 * negative when it has flipped (advance / over-payment).
 */
import { NORMAL_SIDE, TX } from './rules.js';

export const toPaise = (n) => Math.round(Number(n || 0) * 100);
export const fromPaise = (p) => p / 100;
const otherSide = (s) => (s === 'debit' ? 'credit' : 'debit');
const sideCode = (s) => (s === 'debit' ? 'Dr' : 'Cr');

const asId = (t) => String(t.id ?? t._id);

export function sortChronological(txns) {
  return [...txns].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      new Date(a.createdAt) - new Date(b.createdAt) ||
      asId(a).localeCompare(asId(b))
  );
}

// +amount when the entry is on the normal side, -amount otherwise
const signed = (t, normal) => (t.ledgerSide === normal ? toPaise(t.amount) : -toPaise(t.amount));

export function describeBalance(partyType, paise) {
  const normal = NORMAL_SIDE[partyType];
  const side = paise >= 0 ? normal : otherSide(normal);
  return { signed: fromPaise(paise), amount: fromPaise(Math.abs(paise)), side, sideCode: sideCode(side) };
}

/** All-time totals + closing balance for one party (used by the summary tables). */
export function partyTotals(party, txns) {
  const normal = NORMAL_SIDE[party.type];
  let debit = 0;
  let credit = 0;
  let balance = toPaise(party.openingBalance);
  for (const t of txns) {
    if (t.ledgerSide === 'debit') debit += toPaise(t.amount);
    else credit += toPaise(t.amount);
    balance += signed(t, normal);
  }
  return {
    totalDebit: fromPaise(debit),
    totalCredit: fromPaise(credit),
    closing: describeBalance(party.type, balance),
  };
}

const matches = (t, q) => {
  if (!q) return true;
  const hay = [
    t.voucherNo,
    t.accountName,
    TX[t.type]?.label,
    t.paymentMode,
    t.notes,
    ...(t.items ?? []).map((i) => i.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q.trim().toLowerCase());
};

/**
 * Individual party statement.
 *  - rows are chronological, each with the TRUE running balance (filters never change it)
 *  - `from` makes the opening balance include everything before that date
 *  - `type` / `q` only decide which rows are displayed
 *  - totals are of the displayed rows; closing is the true balance after the last in-range entry
 */
export function buildStatement({ party, txns, from, to, type, q }) {
  const normal = NORMAL_SIDE[party.type];
  const ordered = sortChronological(txns);

  let running = toPaise(party.openingBalance);
  for (const t of ordered) if (from && t.date < from) running += signed(t, normal);
  const opening = running;

  const rows = [];
  for (const t of ordered) {
    if (from && t.date < from) continue;
    if (to && t.date > to) continue;
    running += signed(t, normal);
    rows.push({
      id: asId(t),
      date: t.date,
      createdAt: t.createdAt,
      type: t.type,
      typeLabel: TX[t.type].label,
      voucherNo: t.voucherNo,
      accountName: t.accountName,
      paymentMode: t.paymentMode ?? null,
      notes: t.notes ?? '',
      credit: t.ledgerSide === 'credit' ? t.amount : 0,
      debit: t.ledgerSide === 'debit' ? t.amount : 0,
      closing: describeBalance(party.type, running),
      _t: t,
    });
  }

  const shown = rows.filter((r) => (!type || r.type === type) && matches(r._t, q));
  const totals = shown.reduce(
    (a, r) => ({ credit: a.credit + toPaise(r.credit), debit: a.debit + toPaise(r.debit) }),
    { credit: 0, debit: 0 }
  );

  return {
    party: { id: asId(party), name: party.name, phone: party.phone, type: party.type },
    filters: { from: from || null, to: to || null, type: type || null, q: q || '' },
    normalSide: normal,
    opening: describeBalance(party.type, opening),
    rows: shown.map(({ _t, ...r }) => r),
    totals: { credit: fromPaise(totals.credit), debit: fromPaise(totals.debit) },
    closing: describeBalance(party.type, running),
    count: shown.length,
  };
}
