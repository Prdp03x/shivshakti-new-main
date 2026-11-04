import { Routes, Route } from 'react-router-dom';
import AppLayout from '../layout/AppLayout.jsx';
import { navigation } from '../layout/navigation.js';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import SettingsPage from '../features/settings/SettingsPage.jsx';
import PlaceholderPage from '../shared/components/PlaceholderPage.jsx';
import PurchaseEntryPage from '../features/purchases/pages/PurchaseEntryPage.jsx';
import SaleEntryPage from '../features/sales/pages/SaleEntryPage.jsx';
import DebitEntryPage from '../features/ledger/pages/DebitEntryPage.jsx';
import CreditEntryPage from '../features/ledger/pages/CreditEntryPage.jsx';
import CustomerLedgerPage from '../features/ledger/pages/CustomerLedgerPage.jsx';
import OwnerLedgerPage from '../features/ledger/pages/OwnerLedgerPage.jsx';
import PartyLedgerPage from '../features/ledger/pages/PartyLedgerPage.jsx';
import { TransactionRecordsPage, PartyMasterPage, ItemsMasterPage, UnitsMasterPage, BusinessReportPage, StockReportPage, OutstandingReportPage, LedgerReportPage } from '../features/modules/ModulePages.jsx';

// Screens that are built. Any other menu path falls back to a placeholder page.
const builtPages = {
  '/purchase/entry': <PurchaseEntryPage />,
  '/sale/new': <SaleEntryPage />,
  '/ledger/debit': <DebitEntryPage />,
  '/ledger/credit': <CreditEntryPage />,
  '/ledger/customer': <CustomerLedgerPage />,
  '/ledger/owner': <OwnerLedgerPage />,
  '/purchase/records': <TransactionRecordsPage fixedType="purchase" title="Purchase Records" subtitle="All purchase vouchers with supplier, item and ledger details." />,
  '/purchase/report': <TransactionRecordsPage fixedType="purchase" title="Purchase Report" subtitle="Filter, review, print and export purchase activity." />,
  '/sale/records': <TransactionRecordsPage fixedType="sale" title="Sale Records" subtitle="All payments recorded against suppliers." />,
  '/sale/report': <TransactionRecordsPage fixedType="sale" title="Sale Report" subtitle="Filter, review, print and export sale/payment activity." />,
  '/ledger/bills': <TransactionRecordsPage title="Bill Records" subtitle="All purchase, sale, debit and credit vouchers in one register." />,
  '/ledger/report': <LedgerReportPage />,
  '/ledger/debit-records': <TransactionRecordsPage fixedType="debit" title="Debit Records" subtitle="Customer debit bills and their stock movements." />,
  '/ledger/credit-records': <TransactionRecordsPage fixedType="credit" title="Credit Records" subtitle="Customer receipts and credit entries." />,
  '/masters/items': <ItemsMasterPage />,
  '/masters/customers': <PartyMasterPage type="customer" />,
  '/masters/suppliers': <PartyMasterPage type="supplier" />,
  '/masters/units': <UnitsMasterPage />,
  '/reports/business': <BusinessReportPage />,
  '/reports/transactions': <TransactionRecordsPage title="Transaction Report" subtitle="All purchase, sale, debit and credit vouchers for the selected period." />,
  '/reports/stock': <StockReportPage />,
  '/reports/outstanding': <OutstandingReportPage />,
};

// Every dropdown entry in navigation.js automatically gets a route.
const menuRoutes = navigation
  .filter((group) => group.items)
  .flatMap((group) =>
    group.items
      .filter((item) => item.path)
      .map((item) => ({ ...item, group: group.label }))
  );

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {menuRoutes.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={builtPages[item.path] ?? <PlaceholderPage title={item.label} group={item.group} />}
          />
        ))}
        {/* Individual party statements: one component, two ledgers */}
        <Route path="/ledger/customer/:partyId" element={<PartyLedgerPage kind="customers" />} />
        <Route path="/ledger/owner/:partyId" element={<PartyLedgerPage kind="suppliers" />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" group="" />} />
      </Route>
    </Routes>
  );
}
