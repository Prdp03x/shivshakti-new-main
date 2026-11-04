import { useEffect, useState } from 'react';
import DemoModal from './DemoModal.jsx';
import { Field, inputClass } from './FormControls.jsx';
import { primaryBtn } from './formStyles.js';

// onSave({ name, phone }) may be async and throw; the message is shown in the dialog.
export default function AddPartyModal({ open, onClose, onSave, partyType }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setError('');
    }
  }, [open]);

  const save = async () => {
    if (!name.trim()) {
      setError('Party name is required');
      return;
    }
    setBusy(true);
    try {
      await onSave({ name, phone });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    e.stopPropagation(); // don't let the surrounding entry form react to keys typed here
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!busy) save();
    }
  };

  return (
    <DemoModal
      open={open}
      title="Add New Party"
      onClose={onClose}
      closeLabel="Cancel"
      footer={
        <button type="button" onClick={save} disabled={busy} className={`${primaryBtn} disabled:opacity-60`}>
          {busy ? 'Saving...' : 'Save Party'}
        </button>
      }
    >
      <div className="space-y-3" onKeyDown={onKeyDown}>
        <Field label="Party Name" required htmlFor="new-party-name" error={error}>
          <input
            id="new-party-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            className={inputClass(!!error)}
            placeholder="e.g. Krishna Traders"
          />
        </Field>
        <Field label="Phone Number" htmlFor="new-party-phone">
          <input
            id="new-party-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={inputClass()}
            placeholder="10-digit mobile number"
            inputMode="numeric"
          />
        </Field>
        {partyType && (
          <p className="text-xs text-slate-500">
            This party will be added to the <strong>{partyType === 'supplier' ? "Owner's (supplier)" : 'customer'}</strong> ledger.
          </p>
        )}
      </div>
    </DemoModal>
  );
}
