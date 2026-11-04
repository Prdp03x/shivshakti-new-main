import ItemTransactionForm from '../../transactions/components/ItemTransactionForm.jsx';
import { TRANSACTION_TYPES } from '../../transactions/transactionTypes.js';

// Purchase = the shared item form with the "purchase" configuration.
export default function PurchaseForm({ onReset }) {
  return <ItemTransactionForm config={TRANSACTION_TYPES.purchase} onReset={onReset} />;
}
