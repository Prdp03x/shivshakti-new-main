export default function QuickActions({ actions, onAction }) {
  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold text-slate-700">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a)}
            className={`px-4 py-2 text-[13px] font-medium shadow-sm transition-colors sm:min-w-[150px] ${
              a.primary
                ? 'border border-brand-700 bg-brand-600 text-white hover:bg-brand-700'
                : 'border border-slate-400 bg-white text-slate-800 hover:bg-slate-100'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}
