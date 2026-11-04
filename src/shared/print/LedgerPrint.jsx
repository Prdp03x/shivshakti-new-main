import { formatBalance, formatDate, formatMoney } from '../utils/format.js';

const PAGE_SIZE = 37;
const BUSINESS_NAME = 'Shivshakti Hardware & Machine Tools';
const BUSINESS_ADDRESS = 'CERAMIC PLAZA-2, SHOP NO. 27/28/29, 8-A NATIONAL HIGHWAY, NR. LAKHDHIRPUR ROAD, MORBI - 363642';
const amount = (value) => Number(value || 0) ? formatMoney(value) : '—';
const typeShort = (row) => ({ purchase: 'Purchase', sale: 'Sale', debit: 'Debit', credit: 'Credit' }[row.type] || row.typeLabel || row.type || '—');

function Page({ data, rows, page, pages, opening, closing, filters, title }) {
  const pageDebit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const pageCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const period = `${filters.from ? formatDate(filters.from) : 'Beginning'} To ${filters.to ? formatDate(filters.to) : 'Present'}`;
  const closingLabel = page === pages ? 'Closing Balance' : 'Closing Balance (c/f)';

  return (
    <article className="ledger-print-sheet">
      <header className="ledger-print-company">
        <h1>{BUSINESS_NAME}</h1>
        <p>{BUSINESS_ADDRESS}</p>
      </header>

      <section className="ledger-print-meta">
        <div>
          <strong>Account: {data.party.name}{data.party.phone ? ` (${data.party.phone})` : ''}</strong>
          <strong>Period: {period}</strong>
        </div>
        <div className="ledger-print-meta-right">
          <strong>Opening Balance: {formatBalance(opening)}</strong>
          <strong>Page: {page} of {pages}</strong>
        </div>
      </section>

      <table className="ledger-print-table">
        <thead>
          <tr>
            <th className="ledger-date">Date</th>
            {/* <th className="ledger-type">Type</th> */}
            <th className="ledger-voucher">Vch No</th>
            <th>Details</th>
            <th className="ledger-amount">Debit (₹)</th>
            <th className="ledger-amount">Credit (₹)</th>
            <th className="ledger-balance">Balance (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="ledger-opening-row">
            <td>{rows[0]?.date ? formatDate(rows[0].date) : ''}</td>
            {/* <td className="ledger-center">OB</td> */}
            <td>—</td>
            <td colSpan={2}>Opening Balance{page > 1 ? ' (b/f)' : ''}</td>
            {/* <td className="ledger-number">—</td> */}
            <td className="ledger-number">—</td>
            <td className="ledger-number ledger-strong">{formatBalance(opening)}</td>
          </tr>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="ledger-nowrap">{formatDate(row.date)}</td>
              {/* <td className="ledger-center">{typeShort(row)}</td> */}
              <td className="ledger-nowrap">{row.voucherNo || '—'}</td>
              <td>{row.accountName || row.notes || '—'}{row.notes && row.accountName ? ` (${row.notes})` : ''}</td>
              <td className="ledger-number">{amount(row.debit)}</td>
              <td className="ledger-number">{amount(row.credit)}</td>
              <td className="ledger-number ledger-strong">{formatBalance(row.closing)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="ledger-page-total">
            <td colSpan="3">Total (This Page):</td>
            <td className="ledger-number">{amount(pageDebit)}</td>
            <td className="ledger-number">{amount(pageCredit)}</td>
            <td className="ledger-number">{formatBalance(closing)}</td>
          </tr>
          <tr className="ledger-closing-row">
            <td colSpan="5">{closingLabel}:</td>
            <td className="ledger-number">{formatBalance(closing)}</td>
          </tr>
        </tfoot>
      </table>
      <footer className="ledger-print-footer">{title} · {data.count} transaction(s)</footer>
    </article>
  );
}

export default function LedgerPrint({ data, filters, title }) {
  if (!data?.party || !Array.isArray(data.rows)) return null;
  const pages = Math.max(1, Math.ceil(data.rows.length / PAGE_SIZE));
  const chunks = Array.from({ length: pages }, (_, index) => data.rows.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE));
  let opening = data.opening;

  return (
    <div className="print-target-ledger">
      {chunks.map((rows, index) => {
        const closing = rows.length ? rows[rows.length - 1].closing : data.closing;
        const page = (
          <Page
            key={index}
            data={data}
            rows={rows}
            page={index + 1}
            pages={pages}
            opening={opening}
            closing={closing}
            filters={filters}
            title={title}
          />
        );
        opening = closing;
        return page;
      })}
    </div>
  );
}
