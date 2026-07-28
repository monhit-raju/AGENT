export default function Sheet({ number, title, subtitle, children }) {
  return (
    <section className="glass-panel overflow-hidden rounded-3xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {number && (
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-sky-400">
              Module {number}
            </span>
          )}
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{title}</h2>
        </div>
        {subtitle && (
          <span className="inline-flex rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
