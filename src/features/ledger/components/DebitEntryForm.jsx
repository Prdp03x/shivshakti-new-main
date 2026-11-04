import ItemTransactionForm from '../../transactions/components/ItemTransactionForm.jsx';
import { TRANSACTION_TYPES } from '../../transactions/transactionTypes.js';

// Debit Entry = the same item form as Purchase, configured for a customer bill.
export default function DebitEntryForm({ onReset }) {
  return <ItemTransactionForm config={TRANSACTION_TYPES.debit} onReset={onReset} />;
}
