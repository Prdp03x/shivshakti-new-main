import { useState } from 'react';
import PurchaseForm from '../components/PurchaseForm.jsx';

export default function PurchaseEntryPage() {
  const [formKey, setFormKey] = useState(0); // changing the key resets the form
  return <PurchaseForm key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}
