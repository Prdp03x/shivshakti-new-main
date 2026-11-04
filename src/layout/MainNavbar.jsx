import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from './navigation.js';
import NavDropdown from './NavDropdown.jsx';

export default function MainNavbar() {
  const [openId, setOpenId] = useState(null);
  const barRef = useRef(null);
  const { pathname } = useLocation();

  // Close dropdowns on outside click, Escape, or navigation.
  useEffect(() => {
    const onDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenId(null);
    };
    const onKey = (e) => e.key === 'Escape' && setOpenId(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => setOpenId(null), [pathname]);

  return (
    <nav
      ref={barRef}
      className="print:hidden relative z-40 flex items-stretch overflow-visible border-b border-slate-300 bg-slate-50 px-2 sm:px-3"
    >
      {navigation.map((group) =>
        group.items ? (
          <NavDropdown
            key={group.id}
            group={group}
            isOpen={openId === group.id}
            isActive={group.items.some((i) => i.path && pathname.startsWith(i.path.split('/').slice(0, 2).join('/')))}
            onToggle={() => setOpenId((cur) => (cur === group.id ? null : group.id))}
            onHover={() => openId && setOpenId(group.id)}
          />
        ) : (
          <NavLink
            key={group.id}
            to={group.path}
            end
            className={({ isActive }) =>
              `flex items-center border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-brand-600 bg-white text-brand-700'
                  : 'border-transparent text-slate-700 hover:bg-slate-200/70'
              }`
            }
          >
            {group.label}
          </NavLink>
        )
      )}
    </nav>
  );
}
