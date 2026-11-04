import LedgerStatement from '../components/LedgerStatement.jsx';

// Individual statement for either ledger (the same component serves both).
export default function PartyLedgerPage({ kind }) {
  return <LedgerStatement key={kind} kind={kind} />;
}
