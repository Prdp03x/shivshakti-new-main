import { formatDate } from '../utils/format.js';

const BUSINESS_NAME = 'Shivshakti Hardware & Machine Tools';
const BUSINESS_ADDRESS =
  'CERAMIC PLAZA-2, SHOP NO. 27/28/29, 8-A NATIONAL HIGHWAY, NR. LAKHDHIRPUR ROAD, MORBI - 363642';

const money = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const paymentLabel = (value) => {
  if (!value) return 'Not specified';
  return String(value).toUpperCase() === 'UPI'
    ? 'UPI'
    : String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
};

export default function TransactionReportPrint({
  type,
  rows = [],
  from = '',
  to = '',
  search = '',
}) {
  if (!['purchase', 'sale'].includes(type)) return null;

  const isPurchase = type === 'purchase';
  const title = isPurchase ? 'PURCHASE REGISTER' : 'SALES REGISTER';
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const paymentTotals = !isPurchase
    ? rows.reduce((totals, row) => {
        const key = paymentLabel(row.paymentMode);
        totals[key] = (totals[key] || 0) + Number(row.amount || 0);
        return totals;
      }, {})
    : {};

  return (
    <section className={`print-target-transaction-report print-target-${type}-report`}>
      <header className="transaction-report-header">
        <h1>{BUSINESS_NAME}</h1>
        <p>{BUSINESS_ADDRESS}</p>
        <h2>{title}</h2>
      </header>

      <div className="transaction-report-meta">
        <div>
          <strong>Period: </strong>
          {from ? formatDate(from) : 'All dates'}
          {to ? ` to ${formatDate(to)}` : ''}
          {search ? ` · Search: ${search}` : ''}
        </div>
        <div><strong>Records: </strong>{rows.length}</div>
      </div>

      <table className="transaction-report-table">
        <thead>
          <tr>
            <th className="report-center">Sr.</th>
            <th>Date</th>
            <th>Voucher No.</th>
            <th>{isPurchase ? 'Supplier' : 'Customer'}</th>
            {!isPurchase && <th>Payment Mode</th>}
            <th className="report-number">{isPurchase ? 'Purchase Amount (₹)' : 'Sale Amount (₹)'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row._id || `${row.voucherNo}-${index}`}>
              <td className="report-center">{index + 1}</td>
              <td className="report-nowrap">{formatDate(row.date)}</td>
              <td className="report-nowrap">{row.voucherNo || '—'}</td>
              <td>{row.partyName || '—'}</td>
              {!isPurchase && <td>{paymentLabel(row.paymentMode)}</td>}
              <td className="report-number">{money(row.amount)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={isPurchase ? 5 : 6} className="report-empty">
                No transactions found for the selected filters.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={isPurchase ? 4 : 5} className="report-total-label">
              TOTAL ({rows.length} RECORDS)
            </td>
            <td className="report-number">₹ {money(total)}</td>
          </tr>
        </tfoot>
      </table>

      {!isPurchase && Object.keys(paymentTotals).length > 0 && (
        <section className="transaction-report-payment-summary">
          <h3>PAYMENT MODE SUMMARY</h3>
          <table>
            <tbody>
              {Object.entries(paymentTotals).map(([mode, amount]) => (
                <tr key={mode}>
                  <td>{mode}</td>
                  <td className="report-number">₹ {money(amount)}</td>
                </tr>
              ))}
              <tr className="report-payment-total">
                <td>Total Sales</td>
                <td className="report-number">₹ {money(total)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <footer className="transaction-report-footer">
        Generated on {new Date().toLocaleString('en-IN')}
      </footer>
    </section>
  );
}
