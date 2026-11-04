import { useMemo, useState } from 'react';
import { Field } from './FormControls.jsx';
import SearchableSelect from './SearchableSelect.jsx';
import AddPartyModal from './AddPartyModal.jsx';
import useParties from '../hooks/useParties.js';

/**
 * Reusable party picker used by every entry screen.
 *   partyType: 'supplier' (purchase, sale) or 'customer' (debit, credit) — only parties
 *              of that type are listed, and "+ Add New Party" creates one of that type.
 *   value:     selected party id (or null)
 *   onChange:  receives the full party object { id, name, phone }
 */
export default function PartySelector({ id = 'party', partyType, label = 'Party Name', value, onChange, error, className = '' }) {
  const { parties, addParty, error: loadError } = useParties(partyType);
  const [adding, setAdding] = useState(false);
  const options = useMemo(() => parties.map((p) => ({ value: p.id, label: p.name })), [parties]);

  return (
    <Field label={label} required error={error || loadError} htmlFor={id} className={className}>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SearchableSelect
            id={id}
            options={options}
            value={value}
            error={error}
            placeholder="Search or select party..."
            onChange={(partyId) => onChange(parties.find((p) => p.id === partyId))}
          />
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="h-8 shrink-0 border border-brand-600 bg-white px-2.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          + Add New Party
        </button>
      </div>
      <AddPartyModal
        open={adding}
        partyType={partyType}
        onClose={() => setAdding(false)}
        onSave={async (data) => {
          const party = await addParty(data);
          onChange(party);
          setAdding(false);
        }}
      />
    </Field>
  );
}
