import PaymentTransactionForm from '../../transactions/components/PaymentTransactionForm.jsx';
import { TRANSACTION_TYPES } from '../../transactions/transactionTypes.js';

// New Sale = payment form configured for a payment made to a supplier.
export default function SaleForm({ onReset }) {
  return <PaymentTransactionForm config={TRANSACTION_TYPES.sale} onReset={onReset} />;
}
