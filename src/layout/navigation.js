// Navigation configuration. Add new menu groups or items here — the navbar
// and the placeholder routes are both generated from this list.
//
// group:  { id, label, path }                 -> plain link
//         { id, label, items: [...] }         -> dropdown
// item:   { label, path, highlight? }         -> highlight shows a "+" accent
//         { type: 'divider' }                 -> separator line

export const navigation = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'settings', label: 'Settings', path: '/settings' },
  {
    id: 'purchase',
    label: 'Purchase',
    items: [
      { label: 'Purchase Entry', path: '/purchase/entry', highlight: true },
      { label: 'Purchase Records', path: '/purchase/records' },
      { label: 'Purchase Report', path: '/purchase/report' },
    ],
  },
  {
    id: 'sale',
    label: 'Sale',
    items: [
      { label: 'New Sale', path: '/sale/new', highlight: true },
      { label: 'Sale Records', path: '/sale/records' },
      { label: 'Sale Report', path: '/sale/report' },
    ],
  },
  {
    id: 'ledger',
    label: 'Ledger',
    items: [
      { label: 'Customer Ledger', path: '/ledger/customer' },
      { label: "Owner's Ledger", path: '/ledger/owner' },
      { label: 'Bill Records', path: '/ledger/bills' },
      { type: 'divider' },
      { label: 'Debit Entry', path: '/ledger/debit' },
      { label: 'Debit Records', path: '/ledger/debit-records' },
      { label: 'Credit Entry', path: '/ledger/credit' },
      { label: 'Credit Records', path: '/ledger/credit-records' },
      { label: 'Ledger Report', path: '/ledger/report' },
    ],
  },
  {
    id: 'masters',
    label: 'Masters',
    items: [
      { label: 'Items', path: '/masters/items' },
      { label: 'Customers', path: '/masters/customers' },
      { label: 'Suppliers', path: '/masters/suppliers' },
      { label: 'Units', path: '/masters/units' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { label: 'Business Summary', path: '/reports/business' },
      { label: 'Transaction Report', path: '/reports/transactions' },
      { label: 'Stock Report', path: '/reports/stock' },
      { label: 'Outstanding Report', path: '/reports/outstanding' },
    ],
  },
];
