export default function SimulationCanvas({ agents, activeAgentId, completedAgents, simLogs }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-sky-400">Execution Canvas</span>
        <h4 className="text-xs font-bold text-slate-300">Live Agent Pipeline Mapping</h4>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6 px-4 bg-slate-950/40 border border-slate-900 rounded-2xl overflow-x-auto">
        {/* Start Trigger Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_-4px_rgba(52,211,153,0.3)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400">Trigger</span>
        </div>

        {/* Arrow Connector */}
        <div className="hidden md:block shrink-0">
          <svg className="h-5 w-8 text-slate-700 animate-pulse" fill="none" viewBox="0 0 32 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h28m-6-4l6 4-6 4" />
          </svg>
        </div>

        {/* Dynamic Agent Cards sequence */}
        {agents.map((agent, index) => {
          const isActive = activeAgentId === agent.id;
          const isDone = completedAgents.has(agent.id);
          const isPending = !isActive && !isDone;

          let cardBorder = "border-slate-900 bg-slate-950/20";
          let iconColor = "text-slate-600 bg-slate-950 border-slate-900";
          let statusLabel = "Standby";
          let badgeColor = "bg-slate-900 text-slate-500 border-slate-900";

          if (isActive) {
            cardBorder = "border-sky-500 bg-sky-500/5 shadow-[0_0_20px_-5px_rgba(56,189,248,0.25)] glow-active";
            iconColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
            statusLabel = "Executing";
            badgeColor = "bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse";
          } else if (isDone) {
            cardBorder = "border-emerald-500/30 bg-emerald-500/5";
            iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            statusLabel = "Complete";
            badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
          }

          return (
            <div key={agent.id} className="flex flex-col md:flex-row items-center gap-4">
              {/* Agent Node Card */}
              <div className={`w-[140px] shrink-0 border rounded-xl p-3 flex flex-col justify-between h-[100px] transition-all duration-300 ${cardBorder}`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="truncate">
                    <p className="font-display text-[10px] font-bold text-white truncate">{agent.role_name}</p>
                    <p className="font-mono text-[8px] text-slate-500 uppercase truncate mt-0.5">{agent.id}</p>
                  </div>
                  {/* Miniature Dossier Icon */}
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${iconColor}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900/60">
                  <span className={`rounded px-1 py-0.2 font-mono text-[7px] uppercase tracking-wider border ${badgeColor}`}>
                    {statusLabel}
                  </span>
                  {isDone && (
                    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Arrow Connector to next node */}
              {index < agents.length - 1 && (
                <div className="hidden md:block shrink-0">
                  <svg className={`h-5 w-8 transition-colors ${isActive || isDone ? "text-sky-500" : "text-slate-700"} ${isActive ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 32 16" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h28m-6-4l6 4-6 4" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Arrow Connector */}
        <div className="hidden md:block shrink-0">
          <svg className="h-5 w-8 text-slate-700" fill="none" viewBox="0 0 32 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h28m-6-4l6 4-6 4" />
          </svg>
        </div>

        {/* Final Exit Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_-4px_rgba(99,102,241,0.3)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400">Exit</span>
        </div>
      </div>
    </div>
  );
}
