import { useState, useEffect } from "react";
import { checkBackendHealth } from "../api.js";

export default function SidebarNav({ activeTab, onTabChange, status, savedProjects, activeProjectId, onLoadProject, onDeleteProject, onNewProject }) {
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiUrl, setApiUrl] = useState("");

  const tabs = [
    {
      id: "build",
      label: "Architect",
      description: "Generate & structure systems",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: "workspace",
      label: "Code Workspace",
      description: "Monaco editor & previews",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      id: "output",
      label: "Output Console",
      description: "Live stream logs",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      description: "API connections & keys",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "about",
      label: "Information",
      description: "Security & manuals",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const triggerHealthCheck = async () => {
    const storedBase = localStorage.getItem("agent_api_base") || import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
    setApiUrl(storedBase);
    const health = await checkBackendHealth();
    setApiStatus(health);
  };

  useEffect(() => {
    triggerHealthCheck();
    const interval = setInterval(triggerHealthCheck, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <aside className="flex h-full w-full flex-col justify-between bg-slate-950/60 p-6 backdrop-blur-xl border-r border-slate-900">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-[0_0_15px_-3px_rgba(56,189,248,0.5)]">
            <svg className="h-5 w-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-white leading-none">AgentForge</h1>
            <span className="text-[10px] font-mono tracking-widest text-sky-400/80 uppercase">Architect v1.0</span>
          </div>
        </div>

        {/* New Build Trigger Action */}
        <button
          type="button"
          onClick={onNewProject}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-950/80 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-98 shadow-sm"
        >
          <svg className="h-4 w-4 text-sky-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Architect Build
        </button>

        {/* Tab Items */}
        <div className="space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all duration-200 border ${
                  isActive
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_12px_-4px_rgba(56,189,248,0.15)]"
                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border-transparent"
                }`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {tab.icon}
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-none ${isActive ? "text-sky-300" : "text-slate-200 group-hover:text-white"}`}>
                    {tab.label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">{tab.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Saved Projects Build History */}
        {savedProjects && savedProjects.length > 0 && (
          <div className="space-y-2 border-t border-slate-900/60 pt-4">
            <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500 px-2">Build History</span>
            <div className="space-y-1 max-h-[160px] overflow-y-auto scrollbar-none pr-1">
              {savedProjects.filter(p => p && p.id).map((p) => {
                const isActive = activeProjectId === p.id;
                return (
                  <div 
                    key={p.id} 
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all text-xs border ${
                      isActive 
                        ? "bg-sky-500/10 text-sky-400 border-sky-500/10" 
                        : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border-transparent"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onLoadProject(p)}
                      className="flex-1 text-left truncate font-medium mr-2 font-mono text-[10px]"
                      title={p.name}
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(p.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-all shrink-0"
                      title="Delete Build"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Backend API Connection Status Widget */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {apiStatus === "healthy" && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </>
            )}
            {apiStatus === "checking" && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
              </>
            )}
            {apiStatus === "offline" && (
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
            )}
            {apiStatus === "warning" && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
              </>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {apiStatus === "healthy" ? "API Live" : apiStatus === "checking" ? "Verifying..." : apiStatus === "warning" ? "API Mismatched" : "API Offline"}
              </span>
              {status === "loading" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 animate-pulse">Running</span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[9px] text-slate-500 truncate max-w-[150px]" title={apiUrl}>
              {apiUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
