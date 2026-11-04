import { formatDate } from '../../shared/utils/format.js';

const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const bal = (b) => (b.amount === 0 ? '0.00' : `${b.amount.toFixed(2)} ${b.sideCode}`);

/** Download the currently filtered statement as CSV (opens cleanly in Excel). */
export function exportStatementCsv(data, ledgerTitle) {
  const f = data.filters;
  const lines = [
    [`${ledgerTitle} - ${data.party.name}`],
    [`Phone`, data.party.phone || ''],
    [`Period`, `${f.from ? formatDate(f.from) : 'Start'} to ${f.to ? formatDate(f.to) : 'Today'}`],
    ...(f.type || f.q ? [[`Filters`, [f.type && `Type: ${f.type}`, f.q && `Search: ${f.q}`].filter(Boolean).join('; ')]] : []),
    [],
    ['Date', 'Transaction Type', 'Voucher / Bill Number', 'Account Name', 'Credit', 'Debit', 'Closing Balance'],
    ['', 'Opening Balance', '', '', '', '', bal(data.opening)],
    ...data.rows.map((r) => [
      formatDate(r.date),
      r.typeLabel,
      r.voucherNo,
      r.accountName,
      r.credit ? r.credit.toFixed(2) : '',
      r.debit ? r.debit.toFixed(2) : '',
      bal(r.closing),
    ]),
    ['', 'Total', '', '', data.totals.credit.toFixed(2), data.totals.debit.toFixed(2), ''],
    ['', 'Closing Balance', '', '', '', '', bal(data.closing)],
  ];
  const csv = '﻿' + lines.map((l) => l.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.party.name.replace(/[^a-z0-9]+/gi, '_')}_ledger.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
