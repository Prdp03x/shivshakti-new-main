// Small building blocks shared by every entry form.

export const inputClass = (error) =>
  `h-8 w-full border bg-white px-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
    error
      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
      : 'border-slate-400 focus:border-brand-600 focus:ring-brand-600'
  }`;

export function FormSection({ title, children, className = '' }) {
  return (
    <section className={`border border-slate-300 bg-white ${className}`}>
      <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-slate-700">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function Field({ label, required, error, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
