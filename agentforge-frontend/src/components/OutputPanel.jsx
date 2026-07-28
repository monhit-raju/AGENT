import { useEffect, useRef, useState } from "react";

export default function OutputPanel({ output, onClear }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'stages' | 'raw'
  const consoleEndRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, autoScroll]);

  // Export logs to txt
  const handleExport = () => {
    if (!output) return;
    const element = document.createElement("a");
    const file = new Blob([output], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "agentforge-pipeline-logs.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filter output content based on selections
  const getFilteredOutput = () => {
    if (typeof output !== "string") return JSON.stringify(output, null, 2);
    if (!output) return "$ Ready to initiate generation flow...";

    const lines = output.split("\n");
    if (filter === "stages") {
      // Find lines containing stage indicators
      return lines
        .filter((line) => line.startsWith("[") || line.includes("stage") || line.toLowerCase().includes("error"))
        .join("\n");
    }
    return output;
  };

  return (
    <div className="glass-panel flex flex-col rounded-3xl overflow-hidden shadow-lg border border-slate-900">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-900 bg-slate-950 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Developer Output Console
          </span>
        </div>

        {/* Console Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Filters */}
          <div className="flex items-center rounded-lg bg-slate-900/60 p-0.5 border border-slate-800">
            <button
              onClick={() => setFilter("all")}
              className={`rounded px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition ${
                filter === "all" ? "bg-slate-800 text-sky-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Verbose
            </button>
            <button
              onClick={() => setFilter("stages")}
              className={`rounded px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition ${
                filter === "stages" ? "bg-slate-800 text-sky-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Stages
            </button>
          </div>

          {/* Controls */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title="Toggle Auto-Scroll"
            className={`rounded-lg border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition ${
              autoScroll
                ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                : "bg-slate-900/60 border-slate-800 text-slate-500"
            }`}
          >
            Scroll Lock
          </button>

          <button
            onClick={handleExport}
            disabled={!output}
            className="rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 p-1.5 text-slate-400 hover:text-slate-200 transition disabled:opacity-40"
            title="Export Logs"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button
            onClick={onClear}
            className="rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-rose-400 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Output Stream Area */}
      <div className="relative bg-slate-950/70 p-5 min-h-[320px] max-h-[440px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
        {/* CRT Scanline look */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] opacity-20" />
        
        <div className="relative space-y-1.5">
          <pre className="whitespace-pre-wrap">{getFilteredOutput()}</pre>
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
}
