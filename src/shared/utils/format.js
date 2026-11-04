// Today's date (local) as YYYY-MM-DD, used as the default date on entry forms
export const todayISO = () => new Date().toLocaleDateString('en-CA');

// "12.5" / "" / undefined -> number (0 when not a valid number)
export const toNum = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// Indian digit grouping, e.g. ₹1,85,000.00. Accepts numbers or numeric strings.
export const formatMoney = (v, decimals = 2) =>
  '₹' +
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toNum(v));

export const formatQty = (v) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(toNum(v));

// 2026-11-02 -> 02/11/2026
export const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// { amount, sideCode } from the API -> "₹1,800.00 Dr" (no side for a zero balance)
export const formatBalance = (b) => (!b || b.amount === 0 ? formatMoney(0) : `${formatMoney(b.amount)} ${b.sideCode}`);
