/**
 * The two ledgers share every screen; only this configuration differs.
 *   customers -> Customer Ledger        (debit raises what the customer owes)
 *   suppliers -> Owner's Ledger         (credit raises what the owner owes)
 * `kind` is also the API segment: /api/ledger/:kind and /api/ledger/:kind/:partyId
 */
export const LEDGERS = {
  customers: {
    kind: 'customers',
    partyType: 'customer',
    title: 'Customer Ledger',
    subtitle: 'Outstanding balances of all customers',
    nameLabel: 'Customer Name',
    basePath: '/ledger/customer',
    // Column order follows the spec for each ledger
    totalsOrder: ['debit', 'credit'],
    typeOptions: [
      { value: 'debit', label: 'Debit Entry' },
      { value: 'credit', label: 'Credit Entry' },
    ],
    balanceHint: 'Dr = customer owes you · Cr = customer has paid in advance',
  },
  suppliers: {
    kind: 'suppliers',
    partyType: 'supplier',
    title: "Owner's Ledger",
    subtitle: 'Supplier / party accounts and what you owe them',
    nameLabel: 'Supplier / Party Name',
    basePath: '/ledger/owner',
    totalsOrder: ['credit', 'debit'],
    typeOptions: [
      { value: 'purchase', label: 'Purchase' },
      { value: 'sale', label: 'Sale (Payment)' },
    ],
    balanceHint: 'Cr = you owe the supplier · Dr = you have paid in advance',
  },
};
