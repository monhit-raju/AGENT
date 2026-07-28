const SUGGESTIONS = [
  {
    label: "AI Support Agent",
    prompt: "Build an AI-driven customer support platform that routes incoming support tickets, summarizes conversation threads, checks a vector database for answers, and schedules follow-ups automatically.",
  },
  {
    label: "DevOps Orchestrator",
    prompt: "Create a multi-agent DevOps assistant that monitors GitHub repositories for new pull requests, triggers linting and automated tests, summarizes changes, and flags critical files for review.",
  },
  {
    label: "Business Workflow Bot",
    prompt: "Design a business automation workflow that parses uploaded PDF invoices, updates fields in a mock CRM, drafts summary emails, and alerts financial managers for approvals.",
  },
];

export default function InputPanel({ value, onChange, onSubmit, isLoading }) {
  const handleChipClick = (promptText) => {
    if (isLoading) return;
    onChange(promptText);
  };

  const handleClear = () => {
    if (isLoading) return;
    onChange("");
  };

  return (
    <section className="glass-panel overflow-hidden rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Workspace IDE
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Architect a System</h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Specify your requirements in plain English. The agent forge will structure the business spec, draft the orchestration flow, select API tooling, and generate production-ready code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {value.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:brightness-100"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Forging System...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Generate Architectures
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="relative mt-6">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. Build an automated database synchronizer that matches transactions from Stripe to Salesforce, verifies quantities, and triggers slack notifications on success..."
          className="min-h-[160px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-body text-sm leading-relaxed text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-sky-500/80 focus:ring-4 focus:ring-sky-500/10"
        />
        <div className="absolute bottom-4 right-4 text-[11px] font-mono text-slate-600 select-none">
          {value.length} characters
        </div>
      </div>

      {/* Suggested prompts chips */}
      <div className="mt-5 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Quick-Start Templates</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleChipClick(item.prompt)}
              disabled={isLoading}
              className={`rounded-lg border border-slate-900 bg-slate-950/60 px-3 py-2 text-xs text-slate-400 transition-all duration-200 hover:border-sky-500/30 hover:bg-slate-900 hover:text-slate-200 ${
                value === item.prompt ? "border-sky-500/50 bg-sky-500/5 text-sky-300" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
