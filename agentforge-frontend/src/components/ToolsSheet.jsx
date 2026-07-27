import Sheet from "./Sheet.jsx";

export default function ToolsSheet({ toolSelection, architecture }) {
  const stack = toolSelection?.overall_stack || {};
  const perAgent = toolSelection?.per_agent_tools || [];
  const nameLookup = Object.fromEntries(
    (architecture?.agents || []).map((a) => [a.id, a.role_name])
  );

  return (
    <Sheet number="05" title="Tool Selection" subtitle="free-tier prioritized">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-blueprint-muted">
        Recommended Stack
      </p>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(stack).map(([key, val]) => (
          <div key={key} className="rounded border border-blueprint-line bg-blueprint-bg/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-blueprint-cyanDim">
              {key.replace(/_/g, " ")}
            </p>
            <p className="font-display text-sm text-blueprint-ink">{val.choice}</p>
            <p className="mt-1 font-body text-xs text-blueprint-muted">{val.reason}</p>
          </div>
        ))}
      </div>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-blueprint-muted">
        Per-Agent Tools
      </p>
      <div className="flex flex-col gap-2.5">
        {perAgent.map((entry) => (
          <div key={entry.agent_id} className="rounded border border-blueprint-line bg-blueprint-bg/40 p-3">
            <p className="mb-1.5 font-display text-sm text-blueprint-ink">
              {nameLookup[entry.agent_id] || entry.agent_id}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(entry.tools || []).map((t, i) => (
                <span
                  key={i}
                  title={t.requires_api_key ? `${t.reason} — needs ${t.env_var_name}` : t.reason}
                  className="cursor-help rounded-full border border-blueprint-line px-2.5 py-0.5 font-mono text-[11px] text-blueprint-muted"
                >
                  {t.name}
                  {t.free_tier_available && <span className="ml-1 text-blueprint-cyan">●</span>}
                  {t.requires_api_key && <span className="ml-1 text-blueprint-amber">key</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
