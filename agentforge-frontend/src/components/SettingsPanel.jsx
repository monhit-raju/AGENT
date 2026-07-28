import { useState, useEffect } from "react";
import { checkBackendHealth } from "../api.js";

export default function SettingsPanel({ onChange }) {
  const [apiBase, setApiBase] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");

  useEffect(() => {
    const storedBase = localStorage.getItem("agent_api_base") || "";
    const storedKey = localStorage.getItem("agent_api_key") || "";
    const storedGemini = localStorage.getItem("gemini_api_key") || "";
    const storedGroq = localStorage.getItem("groq_api_key") || "";
    setApiBase(storedBase);
    setApiKey(storedKey);
    setGeminiApiKey(storedGemini);
    setGroqApiKey(storedGroq);
  }, []);

  const save = () => {
    if (apiBase) localStorage.setItem("agent_api_base", apiBase);
    else localStorage.removeItem("agent_api_base");
    if (apiKey) localStorage.setItem("agent_api_key", apiKey);
    else localStorage.removeItem("agent_api_key");
    if (geminiApiKey) localStorage.setItem("gemini_api_key", geminiApiKey);
    else localStorage.removeItem("gemini_api_key");
    if (groqApiKey) localStorage.setItem("groq_api_key", groqApiKey);
    else localStorage.removeItem("groq_api_key");
    if (onChange) onChange({ base: apiBase, key: apiKey });
    testConnection();
  };

  const clear = () => {
    setApiBase("");
    setApiKey("");
    setGeminiApiKey("");
    setGroqApiKey("");
    setTestResult(null);
    localStorage.removeItem("agent_api_base");
    localStorage.removeItem("agent_api_key");
    localStorage.removeItem("gemini_api_key");
    localStorage.removeItem("groq_api_key");
    if (onChange) onChange({ base: "", key: "" });
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    // Temporarily save parameters in local variables to run health check
    const currentBase = apiBase || "http://127.0.0.1:8000";
    localStorage.setItem("agent_api_base", currentBase);
    if (apiKey) localStorage.setItem("agent_api_key", apiKey);
    else localStorage.removeItem("agent_api_key");
    if (geminiApiKey) localStorage.setItem("gemini_api_key", geminiApiKey);
    else localStorage.removeItem("gemini_api_key");
    if (groqApiKey) localStorage.setItem("groq_api_key", groqApiKey);
    else localStorage.removeItem("groq_api_key");
    
    const result = await checkBackendHealth();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="glass-panel overflow-hidden rounded-3xl p-6 shadow-lg space-y-6">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-sky-400">Settings</span>
        <h2 className="font-display text-xl font-bold text-white">Connection Parameters</h2>
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
          Configure backend API server locations and authentication headers.
        </p>
      </div>

      <div className="space-y-4">
        {/* API Base Input */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            API Server Base URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={apiBase}
              onChange={(e) => {
                setApiBase(e.target.value);
                setTestResult(null);
              }}
              placeholder="http://127.0.0.1:8000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs text-white placeholder-slate-600 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Authorization Token / Bearer Key (Optional)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="••••••••••••••••••••••••"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs text-white placeholder-slate-600 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
          />
        </div>

        {/* Gemini API Key Input */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Gemini LLM API Key (Forwarded to sandbox)
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => {
              setGeminiApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="AIzaSy..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs text-white placeholder-slate-600 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
          />
        </div>

        {/* Groq API Key Input */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Groq LLM API Key (Forwarded to sandbox)
          </label>
          <input
            type="password"
            value={groqApiKey}
            onChange={(e) => {
              setGroqApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="gsk_..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs text-white placeholder-slate-600 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
          />
        </div>

        {/* Action Controls & Health Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-900">
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all px-4 py-2.5 text-xs font-bold text-slate-950"
            >
              Save Configuration
            </button>
            <button
              onClick={clear}
              className="rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white px-4 py-2.5 text-xs font-bold transition-all"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={testing}
              className="rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900/60 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all inline-flex items-center gap-1.5"
            >
              {testing ? (
                <>
                  <svg className="h-3 w-3 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Pinging...</span>
                </>
              ) : (
                <span>Test Connection</span>
              )}
            </button>

            {testResult && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase ${
                  testResult === "healthy"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : testResult === "warning"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  testResult === "healthy" ? "bg-emerald-400" : testResult === "warning" ? "bg-amber-400" : "bg-rose-400"
                }`} />
                {testResult === "healthy" ? "Connected" : testResult === "warning" ? "Mismatch" : "Failed"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
