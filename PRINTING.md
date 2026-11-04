# Shivshakti print formats

The application uses separate React print templates under `src/shared/print/`.

## Bills
- Purchase Bill and Debit Bill use the supplied A5 cash-memo layout.
- Open a transaction from its View action and choose **Print Bill**.
- The print-size selector defaults to A5; A4 remains available.
- The bill uses the business heading/address from the supplied sample. Item date, quantity, rate and amount are populated from the saved transaction; transaction notes appear in the first item's Note cell.

## Ledgers
- Customer Ledger and Owner's Ledger use the supplied A4 statement layout.
- Choose **Print Statement** on an individual party statement.
- The statement prints the currently selected date/type/search filters.
- Each page has an opening/brought-forward balance, up to 37 transactions, page debit/credit totals, and a closing/carried-forward balance.
- The running balance comes from the ledger API; printing does not recalculate or alter accounting data.

## Browser print dialog
Choose the same paper size as the in-app selector (A5 for bills or A4 for ledgers), portrait orientation, and 100% scale. Disable browser headers/footers for a clean statement.
