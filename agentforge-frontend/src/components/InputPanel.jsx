export default function InputPanel({ value, onChange, onSubmit, isLoading }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_120px_-80px_rgba(15,23,42,0.8)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400/80">Start a new system</p>
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Enter your project idea</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Describe the system, domain, users, or automation you want. The backend will generate the architecture and code context from your request.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="inline-flex min-w-[170px] items-center justify-center rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Generating…" : "Generate system"}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. Build an AI-driven customer support platform that routes tickets, summarizes conversations, and schedules follow-ups automatically..."
        className="mt-6 min-h-[200px] w-full resize-none rounded-[1.75rem] border border-slate-800 bg-slate-950 px-5 py-5 text-sm leading-7 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <span className="rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">AI customer service</span>
        <span className="rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">Team collaboration bot</span>
        <span className="rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">Operational automation engine</span>
      </div>
    </section>
  );
}
