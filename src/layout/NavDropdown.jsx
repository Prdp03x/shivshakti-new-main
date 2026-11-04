import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function NavDropdown({ group, isOpen, isActive, onToggle, onHover }) {
  return (
    <div className="relative" onMouseEnter={onHover}>
      <button
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex h-full items-center gap-1 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
          isOpen
            ? 'border-transparent bg-slate-200 text-slate-900'
            : isActive
            ? 'border-brand-600 bg-white text-brand-700'
            : 'border-transparent text-slate-700 hover:bg-slate-200/70'
        }`}
      >
        {group.label}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 min-w-[200px] border border-slate-300 bg-white py-1 shadow-lg"
        >
          {group.items.map((item, idx) =>
            item.type === 'divider' ? (
              <div key={`d-${idx}`} className="my-1 border-t border-slate-200" />
            ) : (
              <Link
                key={item.path}
                to={item.path}
                role="menuitem"
                className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {item.highlight ? (
                  <span className="w-3 text-center font-bold text-brand-600">+</span>
                ) : (
                  <span className="w-3" />
                )}
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
