import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryCard from './components/SummaryCard.jsx';
import QuickActions from './components/QuickActions.jsx';
import RecentActivityTable, { TypeBadge } from './components/RecentActivityTable.jsx';
import BusinessSnapshot from './components/BusinessSnapshot.jsx';
import DemoModal from '../../shared/components/DemoModal.jsx';
import { api } from '../../api/client.js';
import {
  dashboardMeta,
  summaryCards,
  quickActions,
  recentActivity,
  businessSnapshot,
  formatINR,
  toActivityRow,
  toSnapshot,
} from './data.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // { kind: 'txn', data }
  const [activity, setActivity] = useState(recentActivity); // replaced by live data once loaded
  const [snapshot, setSnapshot] = useState(businessSnapshot);

  useEffect(() => {
    api.get('/transactions?limit=8').then((rows) => setActivity(rows.map(toActivityRow))).catch(() => {});
    api.get('/summary').then((s) => setSnapshot(toSnapshot(s))).catch(() => {});
  }, []);

  const close = () => setModal(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{dashboardMeta.greeting}</h1>
        <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-slate-500">
          <span>{dashboardMeta.subtitle}</span>
          <span className="text-slate-300">|</span>
          <span>{dashboardMeta.date}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((c) => (
          <SummaryCard key={c.id} {...c} />
        ))}
      </div>

      <QuickActions actions={quickActions} onAction={(a) => navigate(a.path)} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivityTable rows={activity} onRowClick={(r) => setModal({ kind: 'txn', data: r })} />
        </div>
        <div>
          <BusinessSnapshot items={snapshot} />
        </div>
      </div>

      <DemoModal open={modal?.kind === 'txn'} title="Transaction Preview" onClose={close}>
        {modal?.kind === 'txn' && (
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
            <dt className="text-slate-500">Reference No.</dt>
            <dd className="font-mono font-medium">{modal.data.ref}</dd>
            <dt className="text-slate-500">Type</dt>
            <dd>
              <TypeBadge type={modal.data.type} />
            </dd>
            <dt className="text-slate-500">Party</dt>
            <dd className="font-medium">{modal.data.party}</dd>
            <dt className="text-slate-500">Date &amp; Time</dt>
            <dd>{modal.data.dateTime}</dd>
            <dt className="text-slate-500">Amount</dt>
            <dd className="text-base font-semibold tabular-nums">{formatINR(modal.data.amount)}</dd>
          </dl>
        )}
      </DemoModal>
    </div>
  );
}
