import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, ChevronDown, User, LogOut, KeyRound, Receipt } from 'lucide-react';

export default function TopHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <header className="print:hidden flex h-11 items-center justify-between bg-brand-800 px-3 text-white sm:px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-white/15 ring-1 ring-white/30">
          <Receipt size={16} />
        </div>
        <span className="text-[13px] font-semibold tracking-wider">SHIVSHAKTI BILLING SYSTEM</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Search bills, parties, items..."
            className="h-7 w-56 rounded border border-white/20 bg-white/10 pl-7 pr-2 text-xs text-white placeholder:text-white/60 focus:border-white/50 focus:bg-white/15 focus:outline-none lg:w-72"
          />
        </div>
        <button className="rounded p-1.5 hover:bg-white/10 sm:hidden" aria-label="Search">
          <Search size={16} />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-7 items-center gap-1.5 rounded px-2 text-xs hover:bg-white/10"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <User size={12} />
            </span>
            <span className="font-medium">Admin</span>
            <ChevronDown size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-slate-300 bg-white py-1 text-xs text-slate-700 shadow-lg">
              <button className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-brand-50">
                <User size={13} /> My Profile
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-brand-50">
                <KeyRound size={13} /> Change Password
              </button>
              <div className="my-1 border-t border-slate-200" />
              <button className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-brand-50">
                <LogOut size={13} /> Logout
              </button>
            </div>
          )}
        </div>

        <button onClick={() => navigate('/settings')} className="rounded p-1.5 hover:bg-white/10" aria-label="Settings">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
