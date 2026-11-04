import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader.jsx';
import MainNavbar from './MainNavbar.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell flex h-full flex-col bg-slate-100">
      <TopHeader />
      <MainNavbar />
      <main className="app-main flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
          <Outlet />
        </div>
      </main>
      <footer className="print:hidden border-t border-slate-300 bg-slate-50 px-4 py-1 text-[11px] text-slate-500 flex justify-between">
        <span>Shivshakti Billing System</span>
        <span>FY 2026-27</span>
      </footer>
    </div>
  );
}
