import Sheet from "./Sheet.jsx";

export default function BusinessSheet({ businessSpec, compact }) {
  const tasks = businessSpec?.key_tasks || [];
  const constraints = businessSpec?.constraints || [];
  const assumptions = businessSpec?.assumptions || [];
  const confidence = (businessSpec?.confidence || "").toLowerCase();

  // Helper for confidence color and progress width
  const getConfidenceInfo = (conf) => {
    switch (conf) {
      case "high":
        return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", width: "w-full", pct: "100%" };
      case "medium":
        return { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", width: "w-3/5", pct: "60%" };
      case "low":
        return { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", width: "w-1/3", pct: "33%" };
      default:
        return { color: "text-slate-400 bg-slate-500/10 border-slate-500/20", width: "w-0", pct: "0%" };
    }
  };

  const confInfo = getConfidenceInfo(confidence);

  return (
    <Sheet
      number={compact ? undefined : "01"}
      title="System Requirement Spec"
      subtitle={businessSpec?.domain ? businessSpec.domain : "Draft"}
    >
      {businessSpec ? (
        <div className="space-y-6">
          {/* Main Goal and Specs Header */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="glass-panel-interactive rounded-2xl p-6 space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Primary System Objective</p>
                <p className="mt-2 text-base font-semibold leading-relaxed text-slate-200">{businessSpec.goal}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-900">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Domain Category</p>
                  <p className="mt-1 text-sm font-bold text-white capitalize">{businessSpec.domain || "General Automation"}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Spec Confidence</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border capitalize ${confInfo.color}`}>
                      {businessSpec.confidence}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-sky-500 ${confInfo.width}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Tasks List */}
            <div className="glass-panel-interactive rounded-2xl p-6 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Requirements Breakdown</p>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-slate-950/50 border border-slate-900 px-3.5 py-2.5 text-xs text-slate-300">
                    <span className="mt-0.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Constraints and Assumptions */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="glass-panel-interactive rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">System Constraints</p>
              </div>
              
              {constraints.length > 0 ? (
                <div className="space-y-2">
                  {constraints.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-950/40 border border-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No operational constraints identified.</p>
              )}
            </div>

            <div className="glass-panel-interactive rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-sky-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Assumptions & Axioms</p>
              </div>

              {assumptions.length > 0 ? (
                <div className="space-y-2">
                  {assumptions.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-950/40 border border-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No special assumptions made.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
          State empty. Generate a system to view specifications.
        </div>
      )}
    </Sheet>
  );
}
