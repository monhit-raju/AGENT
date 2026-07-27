import { useState, useEffect } from "react";

export default function SettingsPanel({ onChange }) {
  const [apiBase, setApiBase] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const storedBase = localStorage.getItem("agent_api_base") || "";
    const storedKey = localStorage.getItem("agent_api_key") || "";
    setApiBase(storedBase);
    setApiKey(storedKey);
  }, []);

  const save = () => {
    if (apiBase) localStorage.setItem("agent_api_base", apiBase);
    else localStorage.removeItem("agent_api_base");
    if (apiKey) localStorage.setItem("agent_api_key", apiKey);
    else localStorage.removeItem("agent_api_key");
    if (onChange) onChange({ base: apiBase, key: apiKey });
  };

  const clear = () => {
    setApiBase("");
    setApiKey("");
    localStorage.removeItem("agent_api_base");
    localStorage.removeItem("agent_api_key");
    if (onChange) onChange({ base: "", key: "" });
  };

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4 shadow-lg">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">API Settings</p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs text-slate-400">API Base URL</label>
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="http://127.0.0.1:8000" className="mt-1 w-full rounded-lg bg-slate-900/80 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-800/50" />
        </div>
        <div>
          <label className="text-xs text-slate-400">API Key (optional)</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="mt-1 w-full rounded-lg bg-slate-900/80 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-800/50" />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950">Save</button>
          <button onClick={clear} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">Clear</button>
        </div>
      </div>
    </div>
  );
}
