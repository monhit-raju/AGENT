export default function Sheet({ number, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800/70 bg-gradient-to-br from-slate-950/95 via-slate-950 to-slate-900/90 p-6 shadow-[0_30px_120px_-80px_rgba(15,23,42,0.8)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {number && <span className="block text-xs uppercase tracking-[0.3em] text-sky-400/70">Step {number}</span>}
          <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        </div>
        {subtitle && <span className="rounded-full border border-slate-800/90 bg-slate-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">{subtitle}</span>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
