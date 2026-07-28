import { useState, useEffect } from "react";

export default function SimulationCanvas({ agents, activeAgentId, completedAgents, simLogs }) {
  // Parse logs to extract agent message exchanges
  const parseLogs = (logs) => {
    if (!logs) return [];
    const lines = logs.split("\n");
    const messages = [];
    
    lines.forEach((line) => {
      if (line.includes("[AGENT_END]")) {
        const parts = line.split("[AGENT_END]");
        if (parts.length > 1) {
          const detail = parts[1].trim();
          const separatorIdx = detail.indexOf("|");
          if (separatorIdx > -1) {
            const agentId = detail.substring(0, separatorIdx).trim();
            const outputStr = detail.substring(separatorIdx + 1).replace("Output:", "").trim();
            try {
              const outputJson = JSON.parse(outputStr);
              const agentObj = agents.find((a) => a.id === agentId);
              const name = agentObj ? agentObj.role_name : agentId;
              messages.push({
                agentId,
                roleName: name,
                data: outputJson,
                raw: outputStr,
              });
            } catch (e) {
              const agentObj = agents.find((a) => a.id === agentId);
              const name = agentObj ? agentObj.role_name : agentId;
              messages.push({
                agentId,
                roleName: name,
                data: { result: outputStr },
                raw: outputStr,
              });
            }
          }
        }
      }
    });
    return messages;
  };

  const messages = parseLogs(simLogs);
  const totalAgentsRun = messages.length;
  const estPromptTokens = totalAgentsRun * 1250;
  const estCompletionTokens = totalAgentsRun * 450;
  const totalTokens = estPromptTokens + estCompletionTokens;
  const estCost = ((estPromptTokens * 0.00007) + (estCompletionTokens * 0.0002)).toFixed(5);

  return (
    <div className="space-y-6 select-text">
      {/* 1. Header & Live Metrics Dashboard */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-sky-400">Execution Canvas</span>
          <h4 className="text-xs font-bold text-slate-300">Live Agent Pipeline Mapping</h4>
        </div>

        {/* Dashboard Scoreboard */}
        {totalAgentsRun > 0 && (
          <div className="flex flex-wrap gap-2.5">
            <div className="rounded-xl border border-slate-900 bg-slate-950/80 px-3 py-1.5 min-w-[90px] text-center">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">Pipeline Coverage</span>
              <span className="text-[11px] font-bold text-sky-400">{totalAgentsRun} / {agents.length} Nodes</span>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-950/80 px-3 py-1.5 min-w-[90px] text-center">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">Est. Tokens</span>
              <span className="text-[11px] font-bold text-emerald-400 font-mono">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-950/80 px-3 py-1.5 min-w-[90px] text-center">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">Est. Run Cost</span>
              <span className="text-[11px] font-bold text-indigo-400 font-mono">${estCost}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Visual Pipeline Stepper */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-5 px-4 bg-slate-950/40 border border-slate-900 rounded-2xl overflow-x-auto">
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

          let cardBorder = "border-slate-900 bg-slate-950/20";
          let iconColor = "text-slate-600 bg-slate-950 border-slate-900";
          let statusLabel = "Standby";
          let badgeColor = "bg-slate-900 text-slate-500 border-slate-900";

          if (isActive) {
            cardBorder = "border-sky-500 bg-sky-500/5 shadow-[0_0_20px_-5px_rgba(56,189,248,0.25)]";
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
              <div className={`w-[140px] shrink-0 border rounded-xl p-3 flex flex-col justify-between h-[100px] transition-all duration-300 ${cardBorder}`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="truncate">
                    <p className="font-display text-[10px] font-bold text-white truncate">{agent.role_name}</p>
                    <p className="font-mono text-[8px] text-slate-500 uppercase truncate mt-0.5">{agent.id}</p>
                  </div>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${iconColor}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900/60">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider border ${badgeColor}`}>
                    {statusLabel}
                  </span>
                  {isDone && (
                    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

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

      {/* 3. Real-Time Collaboration Chat Timeline */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-t border-slate-900 pt-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-sky-400">Collaboration Stream</span>
            <h5 className="text-xs font-bold text-slate-300">Message Exchanges</h5>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1.5">
            {messages.map((msg, idx) => (
              <div key={idx} className="glass-panel border border-slate-900 bg-slate-950/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-mono text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-display font-bold text-slate-200 text-xs">{msg.roleName}</span>
                    <span className="font-mono text-[8px] text-slate-500 uppercase">({msg.agentId})</span>
                  </div>
                  <span className="text-[8.5px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-mono">
                    delivered
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-900 max-h-[140px] overflow-y-auto scrollbar-thin">
                  <pre className="font-mono text-[9.5px] text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                    {typeof msg.data === "object" ? JSON.stringify(msg.data, null, 2) : msg.raw}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
