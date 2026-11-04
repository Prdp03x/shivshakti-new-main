import { formatDate, formatQty } from '../utils/format.js';

const BUSINESS_NAME = 'Shivshakti Hardware & Machine Tools';
const BUSINESS_ADDRESS =
  'CERAMIC PLAZA-2, SHOP NO. 27/28/29, 8-A NATIONAL HIGHWAY, NR. LAKHDHIRPUR ROAD, MORBI - 363642';

const ITEMS_PER_PAGE = 18;

const money = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateTime = (transaction) => {
  const date = transaction.createdAt
    ? new Date(transaction.createdAt)
    : null;

  if (!date || Number.isNaN(date.getTime())) {
    return formatDate(transaction.date);
  }

  return `${formatDate(transaction.date)} ${date.toLocaleTimeString(
    'en-IN',
    { hour: '2-digit', minute: '2-digit' }
  )}`;
};

export default function BillPrint({ transaction }) {
  if (!transaction || !['purchase', 'debit'].includes(transaction.type)) {
    return null;
  }

  const items = transaction.items || [];

  const pages = [];

  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  if (!pages.length) pages.push([]);

  const total = transaction.amount ??
    items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="print-target-bill">

      {pages.map((pageItems, pageIndex) => {
        const lastPage = pageIndex === pages.length - 1;
        const firstItemIndex = pageIndex * ITEMS_PER_PAGE;

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
                    CASH MEMO
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
                    <div className='bill-date-time'>
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
                      <tr key={serial}>
                        <td className="bill-center bill-nowrap center-number">
                          {serial}
                        </td>

                        <td className="bill-item-name">
                          {item.name || '—'}
                        </td>

                        <td className="bill-note">
                          {serial === 1
                            ? transaction.notes || ''
                            : ''}
                        </td>

                        <td style={{fontSize:"50px"}} className="bill-number center-number">
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
                    <tr>
                      <td colSpan="6" className="bill-empty">
                        No item details recorded
                      </td>
                    </tr>
                  )}

                  <tr className="bill-filler-row" aria-hidden="true">
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                </tbody>

                {lastPage && (
                  <tfoot>
                    <tr>
                      <td colSpan="5" className="bill-grand-total-label">
                        Total:
                      </td>
                      <td className="bill-number bill-grand-total-value">
                        ₹ {money(total)}
                      </td>
                    </tr>
                  </tfoot>
                )}

              </table>
            </div>

            {lastPage ? (
              <footer className="bill-bottom-area">

                <div className="bill-terms">
                  <strong>Terms &amp; Conditions:</strong>
                  <p>1. Goods once sold will not be taken back.</p>
                  <p>2. Subject to Morbi jurisdiction only.</p>
                </div>

                <div className="bill-signature">
                  <div className="bill-stamp">
                    [ Seal / Stamp ]
                  </div>

                  <div className="bill-signature-line">
                    <b>For {BUSINESS_NAME}</b>
                    <span>Authorized Signatory</span>
                  </div>
                </div>

              </footer>
            ) : (
              <div className="bill-next-page">
                Continued on next page...
              </div>
            )}

          </article>
        );
      })}

    </div>
  );
}
