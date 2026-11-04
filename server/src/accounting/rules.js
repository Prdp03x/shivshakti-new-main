/**
 * SINGLE SOURCE OF TRUTH for the accounting rules.
 *
 *  Transaction | Party     | Ledger side | Stock
 *  ------------+-----------+-------------+----------
 *  purchase    | supplier  | credit      | increase
 *  sale        | supplier  | debit       | none      (payment made to a supplier)
 *  debit       | customer  | debit       | decrease  (bill raised for a customer)
 *  credit      | customer  | credit      | none      (payment received from a customer)
 *
 * Only transactions with hasItems=true touch inventory, so payments
 * (sale / credit) can never create a stock movement.
 */
export const TX = {
  purchase: { label: 'Purchase', partyType: 'supplier', ledgerSide: 'credit', stockEffect: 'increase', hasItems: true, prefix: 'PUR', first: 1026 },
  sale: { label: 'Sale', partyType: 'supplier', ledgerSide: 'debit', stockEffect: 'none', hasItems: false, prefix: 'SAL', first: 2042 },
  debit: { label: 'Debit Entry', partyType: 'customer', ledgerSide: 'debit', stockEffect: 'decrease', hasItems: true, prefix: 'DR', first: 89 },
  credit: { label: 'Credit Entry', partyType: 'customer', ledgerSide: 'credit', stockEffect: 'none', hasItems: false, prefix: 'CR', first: 106 },
};

export const TX_TYPES = Object.keys(TX);

// The side of a party's ledger that INCREASES what is outstanding.
//   supplier ledger: credit increases what the owner owes the supplier
//   customer ledger: debit increases what the customer owes the owner
export const NORMAL_SIDE = { supplier: 'credit', customer: 'debit' };

export const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'];

export const ACCOUNT_FOR_MODE = {
  Cash: 'Cash A/c',
  UPI: 'UPI A/c',
  Card: 'Card A/c',
  'Bank Transfer': 'Bank A/c',
  Other: 'Other A/c',
};

// Counter-account shown in a party's ledger statement.
export const accountNameFor = (type, paymentMode) =>
  type === 'purchase' ? 'Purchase A/c' : type === 'debit' ? 'Sales A/c' : ACCOUNT_FOR_MODE[paymentMode] ?? 'Other A/c';
