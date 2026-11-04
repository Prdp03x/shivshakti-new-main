# Shivshakti Billing System

React + Vite + Tailwind frontend, Express + Mongoose (MongoDB) backend.

## Run it

You need Node 20+ and a running MongoDB (default `mongodb://127.0.0.1:27017`).

```bash
# 1. backend  (terminal 1)
cd server
npm install
cp .env.example .env        # optional: change MONGODB_URI / PORT
npm run seed                # loads the existing demo parties, items and history (skips if data exists)
npm start                   # API on http://localhost:4000

# 2. frontend (terminal 2, project root)
npm install
npm run dev                 # http://localhost:5173  (/api is proxied to :4000)
```

`npm run seed -- --reset` wipes parties, items and transactions and reloads the demo data.
Set `VITE_API_URL` if the API is hosted elsewhere.

## Accounting rules (single source: `server/src/accounting/rules.js`)

| Transaction  | Party    | Ledger entry   | Stock    |
|--------------|----------|----------------|----------|
| Purchase     | Supplier | Supplier Credit | Increase |
| New Sale     | Supplier | Supplier Debit  | No change (payment to supplier) |
| Debit Entry  | Customer | Customer Debit  | Decrease (bill for customer) |
| Credit Entry | Customer | Customer Credit | No change (payment from customer) |

* **Owner's Ledger (suppliers):** Credit raises what you owe, Debit lowers it. Closing = Credit − Debit, shown `Cr`.
* **Customer Ledger:** Debit raises what the customer owes, Credit lowers it. Closing = Debit − Credit, shown `Dr`.
* A balance on the opposite side (advance / over-payment) is shown with the other label.
* Only Purchase and Debit Entry carry items, so only they can change stock. Payments have no item lines and never touch stock.
* Amounts and totals are always computed on the server (in paise); the browser's totals are never trusted.
* A Debit Entry that needs more stock than is available is rejected. Stock is changed with atomic guarded updates, and a multi-item bill that fails part-way is rolled back, so stock never drifts.
* Voucher numbers are unique per transaction type and suggested automatically (`PUR-1026`, `SAL-2042`, `DR-090`, `CR-106`...).
* Party statements: chronological (date, then entry time), running balance after every row. Date filters roll earlier entries into the opening balance; type and search filters only hide rows and never change a balance. Totals row = displayed rows; Closing Balance = true balance.

## Forms (two only)

* `ItemTransactionForm` — Purchase and Debit Entry
* `PaymentTransactionForm` — New Sale and Credit Entry

Labels, party type and rule text come from `src/features/transactions/transactionTypes.js`.
Both ledgers use `LedgerSummaryTable` (list) and `LedgerStatement` (individual statement).

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/parties?type=customer\|supplier` | list / add parties |
| GET | `/api/items` | items with current stock |
| POST | `/api/transactions` | `{type, partyId, date, voucherNo?, items[]\|amount+paymentMode, notes?}` |
| GET | `/api/transactions/next-voucher?type=` | suggested voucher number |
| GET | `/api/transactions?limit=` | recent activity |
| GET | `/api/ledger/customers` · `/api/ledger/suppliers` | summary tables |
| GET | `/api/ledger/:kind/:partyId?from&to&type&q` | party statement |
| GET | `/api/summary` | dashboard totals |
| GET | `/api/stock/reconcile` | recompute stock from history and compare |

## Tests

```bash
cd server
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/shivshakti_billing_test npm test
```

25 tests: pure ledger maths plus API tests for all four transaction types, balances, stock, rollback,
bursts of simultaneous bills, validation, filters and reconciliation. The test database is dropped afterwards.

## Notes

* No edit/delete of saved transactions yet.
* Transactions are posted one at a time inside the server process, and stock is changed with atomic guarded updates. Run a single API instance (the normal setup for one shop). Developed and tested against a MongoDB-compatible server (FerretDB); please run `npm test` once against your real MongoDB.
* Multi-document MongoDB transactions are not required (works on a standalone `mongod`).
* The four cards at the top of the Dashboard are still static sample figures.

## Additional modules added from the V9 workflow

The Vite frontend now includes functional pages for:

- Purchase Records / Purchase Report
- Sale Records / Sale Report
- Debit Records / Credit Records / Bill Records
- Customer and Supplier masters
- Item and Unit masters
- Business Summary, Transaction Report, Stock Report and Outstanding Report
- Consolidated Ledger Report

The server now exposes create/update/delete routes for parties, items and units. Deletion is blocked when a party or item is referenced by transaction history. Unit renames also update the unit name on existing items. Existing item units are automatically migrated into the Units master when `/api/units` is first requested.

The frontend uses the existing `/api` Vite proxy in development. No new frontend environment variable is required for local use.
