const tones = {
  rose: 'border-rose-300 bg-rose-50 text-rose-800',
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

// Subtle "Transaction Type: DEBIT" marker next to the page title.
export default function TransactionBadge({ badge }) {
  if (!badge) return null;
  return (
    <span className={`border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tones[badge.tone]}`}>
      Transaction Type: {badge.text}
    </span>
  );
}
