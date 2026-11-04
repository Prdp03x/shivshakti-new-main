/**
 * Common shell for every entry screen.
 *   header           – <EntryPageHeader />
 *   children         – form sections
 *   summary          – <TransactionSummary />
 *   summaryPlacement – 'side' (default: right column on wide screens) or 'bottom'
 *
 * Keyboard: Enter inside a text field moves to the next field; from the last
 * field it lands on the Save button, and Enter again saves.
 */
export default function TransactionEntryLayout({
  header,
  children,
  summary,
  onSubmit,
  summaryPlacement = 'side',
}) {
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    const fields = Array.from(
      e.currentTarget.querySelectorAll(
        'input:not([disabled]), textarea:not([disabled]), button[data-enter], button[type="submit"]'
      )
    );
    fields[fields.indexOf(e.target) + 1]?.focus();
  };

  return (
    <div className="mx-auto max-w-5xl">
      {header}
      <form noValidate onKeyDown={onKeyDown} onSubmit={onSubmit}>
        {summaryPlacement === 'bottom' ? (
          <div className="space-y-3">
            {children}
            {summary}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="space-y-3">{children}</div>
            <div className="lg:sticky lg:top-0">{summary}</div>
          </div>
        )}
      </form>
    </div>
  );
}
