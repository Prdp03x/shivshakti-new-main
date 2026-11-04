// Local dummy data for the dashboard demo. No API calls.

export const dashboardMeta = {
  greeting: 'Good Evening, Admin',
  subtitle: 'Business Overview',
  date: 'Monday, 02 November 2026',
};

export const summaryCards = [
  { id: 'today-purchase', label: "TODAY'S PURCHASE", value: '₹ 25,000', icon: 'purchase', tone: 'amber' },
  { id: 'today-sales', label: "TODAY'S SALES", value: '₹ 18,500', icon: 'sale', tone: 'green' },
  { id: 'month-purchase', label: "THIS MONTH'S PURCHASE", value: '₹ 1,85,000', icon: 'purchase', tone: 'amber' },
  { id: 'month-sales', label: "THIS MONTH'S SALES", value: '₹ 2,42,500', icon: 'sale', tone: 'green' },
];

export const quickActions = [
  { id: 'new-purchase', label: '+ New Purchase', primary: true, path: '/purchase/entry' },
  { id: 'new-sale', label: '+ New Sale', primary: true, path: '/sale/new' },
  { id: 'debit', label: 'Debit Entry', primary: false, path: '/ledger/debit' },
  { id: 'credit', label: 'Credit Entry', primary: false, path: '/ledger/credit' },
];

export const recentActivity = [
  { id: 1, dateTime: '02 Nov, 11:45 AM', type: 'Sale', party: 'XYZ Store', ref: 'SAL-2041', amount: 8500 },
  { id: 2, dateTime: '02 Nov, 10:30 AM', type: 'Purchase', party: 'ABC Traders', ref: 'PUR-1025', amount: 12000 },
  { id: 3, dateTime: '02 Nov, 09:50 AM', type: 'Sale', party: 'Mahadev Kirana', ref: 'SAL-2040', amount: 10000 },
  { id: 4, dateTime: '01 Nov, 06:10 PM', type: 'Credit Entry', party: 'Raj Enterprises', ref: 'CR-105', amount: 15000 },
  { id: 5, dateTime: '01 Nov, 04:20 PM', type: 'Purchase', party: 'Patel & Co.', ref: 'PUR-1024', amount: 6000 },
  { id: 6, dateTime: '01 Nov, 01:15 PM', type: 'Debit Entry', party: 'Sharma Distributors', ref: 'DR-088', amount: 4500 },
  { id: 7, dateTime: '01 Nov, 11:05 AM', type: 'Sale', party: 'Om Provision Store', ref: 'SAL-2039', amount: 9250 },
  { id: 8, dateTime: '31 Oct, 05:40 PM', type: 'Purchase', party: 'Gujarat Agro Supplies', ref: 'PUR-1023', amount: 21800 },
];

export const businessSnapshot = [
  { id: 'parties', label: 'Total Parties', value: '128', icon: 'parties' },
  { id: 'items', label: 'Total Items', value: '342', icon: 'items' },
  { id: 'receivables', label: 'Pending Receivables', value: '₹ 86,400', icon: 'receivable', tone: 'green' },
  { id: 'payables', label: 'Pending Payables', value: '₹ 52,300', icon: 'payable', tone: 'red' },
];

export const formatINR = (n) =>
  '₹' + new Intl.NumberFormat('en-IN').format(n);

// ---- live data mapping (API -> the shapes the dashboard components already use) ----
const TYPE_LABEL = { purchase: 'Purchase', sale: 'Sale', debit: 'Debit Entry', credit: 'Credit Entry' };
const TZ = 'Asia/Kolkata';

export const toActivityRow = (t) => {
  const d = new Date(t.createdAt);
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: TZ }).format(d);
  return { id: t.id, dateTime: `${day}, ${time}`, type: TYPE_LABEL[t.type], party: t.partyName, ref: t.voucherNo, amount: t.amount };
};

export const toSnapshot = (s) => [
  { id: 'parties', label: 'Total Parties', value: String(s.totalParties), icon: 'parties' },
  { id: 'items', label: 'Total Items', value: String(s.totalItems), icon: 'items' },
  { id: 'receivables', label: 'Pending Receivables', value: `₹ ${formatINR(s.pendingReceivables)}`.replace('₹ ₹', '₹ '), icon: 'receivable', tone: 'green' },
  { id: 'payables', label: 'Pending Payables', value: `₹ ${formatINR(s.pendingPayables)}`.replace('₹ ₹', '₹ '), icon: 'payable', tone: 'red' },
];
