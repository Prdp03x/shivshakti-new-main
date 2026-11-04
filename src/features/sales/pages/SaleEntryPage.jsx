import { useState } from 'react';
import SaleForm from '../components/SaleForm.jsx';

export default function SaleEntryPage() {
  const [formKey, setFormKey] = useState(0);
  return <SaleForm key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}
