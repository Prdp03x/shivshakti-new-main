import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClass } from './FormControls.jsx';

/**
 * Searchable combobox.
 *   options: [{ value, label, hint? }]   (hint = small grey text on the right, e.g. a unit)
 *   rowAttr: optional id exposed as data-row on the wrapper (used to focus a table row)
 *   error:   truthy -> red border
 * Keyboard: type to filter, ↑/↓ to move, Enter to select, Esc to close.
 * The list is position:fixed so scrolling tables never clip it.
 */
export default function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  rowAttr,
  emptyText = 'No matches found',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const openList = () => {
    if (open) return;
    const r = wrapRef.current.getBoundingClientRect();
    const width = Math.max(r.width, 220);
    const below = window.innerHeight - r.bottom;
    setPos(
      below < 230 && r.top > below
        ? { bottom: window.innerHeight - r.top + 2, left: r.left, width }
        : { top: r.bottom + 2, left: r.left, width }
    );
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
    setOpen(true);
  };

  // Close when the page (or a scroll container) scrolls or the window resizes.
  useEffect(() => {
    if (!open) return;
    const onScroll = (e) => {
      if (!listRef.current?.contains(e.target)) close();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // Keep the highlighted option visible inside the list.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.children[active];
    if (!el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [active, open, filtered.length]);

  const choose = (opt) => {
    onChange(opt.value);
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) openList();
      else setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openList();
      else setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault(); // selecting must not also count as "next field"
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      close();
    }
  };

  return (
    <div ref={wrapRef} data-row={rowAttr} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={open ? query : selected?.label ?? ''}
        placeholder={open && selected ? selected.label : placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          if (!open) openList();
        }}
        onFocus={(e) => {
          e.target.select();
          openList();
        }}
        onClick={openList}
        onBlur={close}
        onKeyDown={onKeyDown}
        className={`${inputClass(error)} pr-7`}
      />
      <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />

      {open && pos && (
        <ul
          ref={listRef}
          role="listbox"
          style={{ ...pos, position: 'fixed' }}
          className="z-[90] max-h-56 overflow-y-auto border border-slate-400 bg-white py-0.5 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500">{emptyText}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in the input
                  choose(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-[13px] ${
                  i === active ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                } ${o.value === value ? 'font-semibold' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-[11px] text-slate-400">{o.hint}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
