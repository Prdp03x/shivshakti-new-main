import PaymentTransactionForm from '../../transactions/components/PaymentTransactionForm.jsx';
import { TRANSACTION_TYPES } from '../../transactions/transactionTypes.js';

// Credit Entry = the same payment form as New Sale, configured for a customer payment.
export default function CreditEntryForm({ onReset }) {
  return <PaymentTransactionForm config={TRANSACTION_TYPES.credit} onReset={onReset} />;
}
