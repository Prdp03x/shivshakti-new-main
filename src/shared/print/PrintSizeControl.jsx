import { useState } from 'react';
import { Printer } from 'lucide-react';
import { printDocument } from './print.js';

export default function PrintSizeControl({ target = 'page', disabled = false, label = 'Print', defaultSize = 'A4', sizes = ['A4', 'A5'], usePrinterDefault = false }) {
  const [size, setSize] = useState(defaultSize);
  return (
    <div className="no-print inline-flex h-8 items-center gap-1">
      {!usePrinterDefault && sizes.length > 1 && (
        <select
          aria-label="Print paper size"
          title="Choose paper size"
          value={size}
          onChange={(event) => setSize(event.target.value)}
          className="h-8 border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
        >
          {sizes.map((paperSize) => <option key={paperSize} value={paperSize}>{paperSize}</option>)}
        </select>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => printDocument(target, usePrinterDefault ? undefined : size)}
        className="inline-flex h-8 items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Printer size={13} /> {label}
      </button>
    </div>
  );
}
