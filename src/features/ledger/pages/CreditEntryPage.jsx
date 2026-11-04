import { useState } from 'react';
import CreditEntryForm from '../components/CreditEntryForm.jsx';

export default function CreditEntryPage() {
  const [formKey, setFormKey] = useState(0);
  return <CreditEntryForm key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}
