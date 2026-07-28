import Sheet from "./Sheet.jsx";

export default function AgentsSheet({ architecture }) {
  const agents = architecture?.agents || [];

  return (
    <Sheet number="02" title="Agent Architecture" subtitle={`${agents.length} System Nodes`}>
      {agents.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="glass-panel-interactive overflow-hidden rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                {/* Dossier Header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-display text-base font-bold text-white group-hover:text-sky-300">
                      {agent.role_name}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                      ID: {agent.id}
                    </p>
                  </div>
                  
                  {/* Decorative Agent Badge */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <p className="font-body text-xs leading-relaxed text-slate-300">
                  {agent.responsibility}
                </p>
              </div>

              {/* Capabilities chip list */}
              {agent.capabilities?.length > 0 && (
                <div className="mt-5 pt-3 border-t border-slate-900/60">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="rounded-md bg-slate-950 border border-slate-800/80 px-2 py-1 font-mono text-[10px] text-slate-400 transition hover:border-sky-500/30 hover:text-sky-300"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
          No agent nodes allocated yet.
        </div>
      )}
    </Sheet>
  );
}
