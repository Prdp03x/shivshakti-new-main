import { formatDate, formatQty } from '../utils/format.js';
const getBillTitle = (transaction) => {
  // If transaction is a purchase bill
  if (transaction.type === 'purchase') {
    return 'Purchase Items';
  }
  
  // If transaction is debit / cash memo
  if (transaction.type === 'debit') {
    return 'Cash Memo';
  }

  // Fallback to custom billType or default
  return transaction.billType || 'Cash Memo';
};

const BUSINESS_NAME = 'Shivshakti Hardware & Machine Tools';
const BUSINESS_ADDRESS =
  'CERAMIC PLAZA-2, SHOP NO. 27/28/29, 8-A NATIONAL HIGHWAY, NR. LAKHDHIRPUR ROAD, MORBI - 363642';

// Vertical line budgets and character wrap thresholds per line
const A5_CONFIG = {
  maxLines: 25,       // Max safe text lines on A5 sheet height
  charsPerLine: 24,   // ~45mm item column width at 7.2pt font
};

const A4_CONFIG = {
  maxLines: 34,       // Max safe text lines on A4 sheet height
  charsPerLine: 38,   // ~63mm item column width at 8pt font
};

const money = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateTime = (transaction) => {
  const date = transaction.createdAt ? new Date(transaction.createdAt) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return formatDate(transaction.date);
  }

  return `${formatDate(transaction.date)} ${date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

// Line-budget pagination: accounts for multi-line item names
function paginateByLineBudget(items, maxLines, charsPerLine, notes) {
  const pages = [];
  let currentPage = [];
  let currentLines = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nameLength = (item.name || '').trim().length;

    // Estimate lines taken by the item name (minimum 1 line)
    let itemLines = Math.max(1, Math.ceil(nameLength / charsPerLine));

    // First item carries the notes column text if present
    if (i === 0 && notes) {
      const noteLines = Math.max(1, Math.ceil(notes.length / 18));
      itemLines = Math.max(itemLines, noteLines);
    }

    // If adding this row exceeds the vertical line budget, break to new page
    if (currentLines + itemLines > maxLines && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentLines = 0;
    }

    currentPage.push(item);
    currentLines += itemLines;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  if (!pages.length) {
    pages.push([]);
  }

  return pages;
}

function BillPages({ transaction, config, layoutClass }) {
  const items = transaction.items || [];
  const billTitle = getBillTitle(transaction);
  const pages = paginateByLineBudget(
    items,
    config.maxLines,
    config.charsPerLine,
    transaction.notes
  );

  const grandTotal =
    transaction.amount ??
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Maintain continuous serial numbers across dynamic page splits
  let runningItemIndex = 0;

  return (
    <div className={`bill-layout-group ${layoutClass}`}>
      {pages.map((pageItems, pageIndex) => {
        const lastPage = pageIndex === pages.length - 1;
        const firstItemIndex = runningItemIndex;
        runningItemIndex += pageItems.length;

        const pageSubtotal = pageItems.reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount ??
                Number(item.qty || 0) * Number(item.rate || 0)
            ),
          0
        );

        return (
          <article className="bill-print" key={pageIndex}>
            <div className="bill-top-area">
              <header className="bill-company-header">
                <h1>{BUSINESS_NAME}</h1>
                <p>{BUSINESS_ADDRESS}</p>
              </header>

              <section className="bill-info">
                <div className="bill-party-block">
                  <strong className="bill-document-title">
                    {billTitle}
                    {pageIndex > 0 && ' (Continued)'}
                  </strong>

                  <div>
                    <b>Party Name:</b>
                    <span className="bill-party-name">
                      {transaction.partyName || '—'}
                    </span>
                  </div>
                </div>

                <div className="bill-number-block">
                  <div>
                    <b>Bill No:</b>
                    <span>{transaction.voucherNo || '—'}</span>
                  </div>

                  <div>
                    <div className="bill-date-time">
                      <b>Date &amp; Time:</b>
                      <p>{dateTime(transaction)}</p>
                    </div>
                  </div>

                  <small>
                    Page {pageIndex + 1} of {pages.length}
                  </small>
                </div>
              </section>
            </div>

            <div className="bill-table-wrap">
              <table className="bill-items">
                <thead>
                  <tr>
                    <th className="bill-sr-col">No.</th>
                    <th>Item</th>
                    <th className="bill-note-col">Note</th>
                    <th className="bill-qty-col">Qty</th>
                    <th className="bill-price-col">Price (₹)</th>
                    <th className="bill-total-col">Total (₹)</th>
                  </tr>
                </thead>

                <tbody>
                  {pageItems.map((item, index) => {
                    const serial = firstItemIndex + index + 1;

                    return (
                      <tr key={serial} className="bill-item-row">
                        <td className="bill-center bill-nowrap center-number">
                          {serial}
                        </td>

                        <td className="bill-item-name">
                          {item.name || '—'}
                        </td>

                        <td className="bill-note">
                          {serial === 1 ? transaction.notes || '' : ''}
                        </td>

                        <td className="bill-number center-number">
                          {formatQty(item.qty)}
                        </td>

                        <td className="bill-number center-number">
                          {money(item.rate)}
                        </td>

                        <td className="bill-number center-number">
                          {money(
                            item.amount ??
                              Number(item.qty || 0) * Number(item.rate || 0)
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!items.length && (
                    <tr className="bill-item-row">
                      <td colSpan="6" className="bill-empty">
                        No item details recorded
                      </td>
                    </tr>
                  )}

                  {/* Filler row stretches to absorb all remaining white space */}
                  <tr className="bill-filler-row" aria-hidden="true">
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                </tbody>

                <tfoot>
                  {lastPage ? (
                    <tr className="bill-total-row">
                      <td colSpan="5" className="bill-grand-total-label">
                        Total:
                      </td>
                      <td className="bill-number bill-grand-total-value">
                        ₹ {money(grandTotal)}
                      </td>
                    </tr>
                  ) : (
                    <tr className="bill-total-row bill-continue-row">
                      <td colSpan="3" className="bill-continue-cell">
                        *** Continued on Page {pageIndex + 2} of {pages.length} ***
                      </td>
                      <td colSpan="2" className="bill-grand-total-label">
                        Page Total:
                      </td>
                      <td className="bill-number bill-grand-total-value">
                        ₹ {money(pageSubtotal)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            <footer className="bill-bottom-area">
              <div className="bill-terms">
                {lastPage ? (
                  <>
                    <strong>Terms &amp; Conditions:</strong>
                    <p>1. Goods once sold will not be taken back.</p>
                    <p>2. Subject to Morbi jurisdiction only.</p>
                  </>
                ) : (
                  <div className="bill-terms-continued">
                    <strong>Notice:</strong>
                    <p>1. Continued Cash Memo — Continued on Page {pageIndex + 2}.</p>
                    <p>2. Final Grand Total &amp; Official Seal on Page {pages.length}.</p>
                  </div>
                )}
              </div>

              <div className="bill-signature">
                <div className="bill-stamp">
                  {lastPage ? '[ Seal / Stamp ]' : ''}
                </div>

                <div className="bill-signature-line">
                  <b>For {BUSINESS_NAME}</b>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

export default function BillPrint({ transaction }) {
  if (!transaction || !['purchase', 'debit'].includes(transaction.type)) {
    return null;
  }

  return (
    <div className="print-target-bill">
      {/* Dynamic line budgeting for A5 */}
      <BillPages
        transaction={transaction}
        config={A5_CONFIG}
        layoutClass="bill-layout-a5"
      />

      {/* Dynamic line budgeting for A4 */}
      <BillPages
        transaction={transaction}
        config={A4_CONFIG}
        layoutClass="bill-layout-a4"
      />
    </div>
  );
}