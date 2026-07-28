import Sheet from "./Sheet.jsx";

export default function ToolsSheet({ toolSelection, architecture }) {
  const stack = toolSelection?.overall_stack || {};
  const perAgent = toolSelection?.per_agent_tools || [];
  
  // Create a mapping of agent IDs to their display names
  const nameLookup = Object.fromEntries(
    (architecture?.agents || []).map((a) => [a.id, a.role_name])
  );

  return (
    <Sheet number="05" title="Tool Configuration" subtitle="Free-tier Optimized">
      <div className="space-y-6">
        {/* Recommended Overall Tech Stack */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">
            Recommended Infrastructure Stack
          </p>
          {Object.keys(stack).length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(stack).map(([key, val]) => (
                <div key={key} className="glass-panel-interactive rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-sky-400">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">{val.choice}</p>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{val.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No recommendations available.</p>
          )}
        </div>

        {/* Per-Agent Specific Tools */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">
            Per-Agent API Toolkits
          </p>
          {perAgent.length ? (
            <div className="flex flex-col gap-3">
              {perAgent.map((entry) => (
                <div key={entry.agent_id} className="glass-panel-interactive rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-900/60 pb-2">
                    <p className="text-xs font-bold text-slate-200">
                      {nameLookup[entry.agent_id] || entry.agent_id}
                    </p>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
                      Agent ID: {entry.agent_id}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(entry.tools || []).map((t, i) => (
                      <span
                        key={i}
                        title={t.requires_api_key ? `${t.reason} — Needs env: ${t.env_var_name}` : t.reason}
                        className="cursor-help inline-flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-900 px-3 py-1.5 font-mono text-[10px] text-slate-400 hover:border-sky-500/30 hover:text-sky-300"
                      >
                        <span>{t.name}</span>
                        {t.free_tier_available && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Free Tier Available" />
                        )}
                        {t.requires_api_key && (
                          <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[8px] font-bold uppercase text-amber-400">
                            Key Req
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No agent toolsets configured.</p>
          )}
        </div>
      </div>
    </Sheet>
  );
}
