const STAGES = [
  "Business Understanding",
  "Agent Planner",
  "Workflow Designer",
  "Validation",
  "Prompt Generator",
  "Tool Selector",
  "Code Generator",
];

export default function PipelineTrace({ activeIndex, doneCount }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_20px_90px_-40px_rgba(15,23,42,0.8)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-sky-400/80">Pipeline progress</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Generation flow</h2>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-sm text-slate-300">
          {doneCount}/{STAGES.length} complete
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {STAGES.map((stage, index) => {
          const isDone = index < doneCount;
          const isActive = index === activeIndex;

          return (
            <div
              key={stage}
              className={`rounded-[1.5rem] border px-4 py-4 transition ${isDone ? "border-emerald-500/20 bg-emerald-500/10" : isActive ? "border-sky-500/20 bg-sky-500/10" : "border-slate-800 bg-slate-900/80"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{stage}</p>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${isDone ? "bg-emerald-400/15 text-emerald-200" : isActive ? "bg-sky-400/15 text-sky-200" : "bg-slate-800 text-slate-400"}`}>
                  {isDone ? "Done" : isActive ? "Running" : "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
