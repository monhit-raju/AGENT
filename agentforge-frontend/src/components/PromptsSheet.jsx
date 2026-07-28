import { useState } from "react";
import Sheet from "./Sheet.jsx";

export default function PromptsSheet({ prompts, architecture }) {
  const [openId, setOpenId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const promptList = prompts?.prompts || [];
  const nameLookup = Object.fromEntries(
    (architecture?.agents || []).map((a) => [a.id, a.role_name])
  );

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error("Failed to copy text", e);
    }
  };

  return (
    <Sheet number="04" title="Orchestration Prompts" subtitle={`${promptList.length} Prompts`}>
      {promptList.length ? (
        <div className="space-y-3">
          {promptList.map((prompt) => {
            const isOpen = openId === prompt.agent_id;
            const isCopied = copiedId === prompt.agent_id;
            const agentName = nameLookup[prompt.agent_id] || prompt.agent_id;

            return (
              <div
                key={`${prompt.agent_id}-${prompt.system_prompt?.slice(0, 20)}`}
                className="rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden transition-all duration-200 hover:border-slate-800/80"
              >
                {/* Accordion Trigger */}
                <div className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : prompt.agent_id)}
                    className="flex-1 flex items-start gap-4 text-slate-100"
                  >
                    {/* Status Dot */}
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                    <div>
                      <p className="font-semibold text-sm leading-none text-slate-200">
                        {agentName}
                      </p>
                      <span className="inline-block mt-1 font-mono text-[9px] text-slate-500 uppercase">
                        {prompt.agent_id}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(prompt.agent_id, prompt.system_prompt)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                        isCopied
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : prompt.agent_id)}
                      className="rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-1.5 text-slate-400 hover:text-slate-200 transition"
                    >
                      <svg
                        className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="border-t border-slate-900 bg-slate-950 p-4">
                    <pre className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-900 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap select-all">
                      {prompt.system_prompt}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
          Orchestrator prompt library empty. Proceed with generation.
        </div>
      )}
    </Sheet>
  );
}
