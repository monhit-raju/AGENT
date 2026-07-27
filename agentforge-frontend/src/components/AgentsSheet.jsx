import Sheet from "./Sheet.jsx";

export default function AgentsSheet({ architecture }) {
  const agents = architecture?.agents || [];

  return (
    <Sheet number="02" title="Agent Architecture" subtitle={`${agents.length} agents`}>
      {agents.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="overflow-hidden rounded-[1.8rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.9)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{agent.role_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{agent.id}</p>
                </div>
                <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300">Agent</span>
              </div>
              <p className="text-sm leading-7 text-slate-300">{agent.responsibility}</p>
              {agent.capabilities?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {agent.capabilities.map((capability) => (
                    <span key={capability} className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300">
                      {capability}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No agents generated yet.</p>
      )}
    </Sheet>
  );
}
