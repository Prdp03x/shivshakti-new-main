import { useState } from 'react';
import DebitEntryForm from '../components/DebitEntryForm.jsx';

export default function DebitEntryPage() {
  const [formKey, setFormKey] = useState(0);
  return <DebitEntryForm key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}
