import { useState } from "react";
import Sheet from "./Sheet.jsx";

export default function PromptsSheet({ prompts, architecture }) {
  const [openId, setOpenId] = useState(null);
  const promptList = prompts?.prompts || [];
  const nameLookup = Object.fromEntries((architecture?.agents || []).map((a) => [a.id, a.role_name]));

  return (
    <Sheet number="04" title="System Prompts" subtitle={`${promptList.length} prompts`}>
      {promptList.length ? (
        <div className="space-y-4">
          {promptList.map((prompt) => {
            const isOpen = openId === prompt.agent_id;
            return (
              <div key={`${prompt.agent_id}-${prompt.system_prompt?.slice(0, 30)}`} className="rounded-3xl border border-slate-800 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : prompt.agent_id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-slate-100"
                >
                  <div>
                    <p className="font-semibold">{nameLookup[prompt.agent_id] || prompt.agent_id}</p>
                    <p className="text-xs text-slate-500">{prompt.agent_id}</p>
                  </div>
                  <span className="text-sm text-slate-400">{isOpen ? "Hide" : "View"}</span>
                </button>
                {isOpen && (
                  <pre className="whitespace-pre-wrap border-t border-slate-800 bg-slate-900 px-5 py-4 text-sm leading-6 text-slate-200">
                    {prompt.system_prompt}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400">System prompts will appear here once generation completes.</p>
      )}
    </Sheet>
  );
}
