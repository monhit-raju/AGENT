import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import Sheet from "./Sheet.jsx";
import { downloadCustomProject, runSimulation } from "../api.js";

export default function CodeSheet({ generatedCode, validationReport, onCodeChange, businessSpec }) {
  const files = generatedCode || {};
  const fileNames = Object.keys(files);
  const [selected, setSelected] = useState(fileNames[0] || null);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState("code"); // "code" | "preview" | "tests"
  const [testStates, setTestStates] = useState({});
  const [openTestLogs, setOpenTestLogs] = useState({});
  const [openTestOutputs, setOpenTestOutputs] = useState({});

  const rawTestCases = businessSpec?.test_cases;
  const testCases = Array.isArray(rawTestCases) ? rawTestCases : [
    {
      name: "Standard Client Query",
      input_data: { query: "How do I update my profile details?" }
    },
    {
      name: "Out of Scope Request",
      input_data: { query: "What is the capital of France?" }
    }
  ];

  const runTestCase = async (index, testCase) => {
    setTestStates((prev) => ({
      ...prev,
      [index]: { status: "running", logs: "Initializing test runner...\n", output: null }
    }));
    
    const startTime = Date.now();
    let accumulatedLogs = "";
    
    try {
      await runSimulation(files, testCase.input_data, (chunk) => {
        const text = chunk?.output || "";
        if (text) {
          accumulatedLogs += text;
          setTestStates((prev) => ({
            ...prev,
            [index]: {
              ...prev[index],
              logs: accumulatedLogs
            }
          }));
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
      const passed = accumulatedLogs.includes("[SIMULATOR] Simulation run completed successfully!");
      
      let parsedOutput = null;
      if (accumulatedLogs.includes("[SIMULATOR_RESULT]")) {
        try {
          const parts = accumulatedLogs.split("[SIMULATOR_RESULT]");
          const resultStr = parts[1].trim();
          parsedOutput = JSON.parse(resultStr);
        } catch (e) {
          console.error("Failed to parse simulation result:", e);
        }
      }
      
      setTestStates((prev) => ({
        ...prev,
        [index]: {
          status: passed ? "passed" : "failed",
          logs: accumulatedLogs,
          duration,
          output: parsedOutput
        }
      }));
    } catch (e) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
      setTestStates((prev) => ({
        ...prev,
        [index]: {
          status: "failed",
          logs: accumulatedLogs + `\n[RUNNER EXCEPTION] Run failed: ${e.message}\n`,
          duration,
          output: null
        }
      }));
    }
  };

  useEffect(() => {
    if (!selected && fileNames.length > 0) {
      setSelected(fileNames[0]);
    }
  }, [fileNames.length, selected]);

  useEffect(() => {
    setViewMode("code");
  }, [selected]);

  const isValid = validationReport?.is_valid;
  const activeContent = selected ? files[selected] : "";

  const handleEditorChange = (value) => {
    if (selected && onCodeChange) {
      onCodeChange(selected, value);
    }
  };

  const handleCopy = async () => {
    if (!activeContent) return;
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadCustomProject(files);
    } catch (e) {
      console.error(e);
      alert("Failed to compile and download project ZIP.");
    } finally {
      setDownloading(false);
    }
  };

  // Helper file icon selector
  const getFileIcon = (name) => {
    if (name.endsWith(".py")) {
      return (
        <svg className="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm-1 2h2v4h-2V4zm0 6h2v6h-2v-6zm0 8h2v2h-2v-2z" />
        </svg>
      );
    }
    if (name.endsWith(".js") || name.endsWith(".jsx")) {
      return (
        <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h18v18H3V3zm12.5 13.5c0-.8-.7-1.5-1.5-1.5h-2v-1.5h2c.8 0 1.5-.7 1.5-1.5V11c0-.8-.7-1.5-1.5-1.5H10v9h3.5c.8 0 1.5-.7 1.5-1.5v-1z" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <Sheet number="06" title="Generated Code Workspace" subtitle={`${fileNames.length} Modules`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isValid
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isValid ? "bg-emerald-400" : "bg-rose-400"}`} />
            {isValid ? "Linter Validation Passed" : "Structure Warnings Detected"}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || !fileNames.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {downloading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Workspace (.zip)
            </>
          )}
        </button>
      </div>

      {fileNames.length ? (
        <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
          {/* File Explorer */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between max-h-[460px] overflow-y-auto">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1.5">
                Workspace Files
              </p>
              <div className="space-y-1.5">
                {fileNames.map((name) => {
                  const isSelected = selected === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelected(name)}
                      className={`flex w-full items-center gap-2 truncate rounded-lg px-2.5 py-2 text-left font-mono text-[10px] transition-all duration-150 ${
                        isSelected
                          ? "bg-sky-500/10 text-sky-300 border border-sky-500/20"
                          : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {getFileIcon(name)}
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="glass-panel flex flex-col rounded-2xl overflow-hidden max-h-[460px] border border-slate-900">
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-900 bg-slate-950/80 px-4 py-2">
              <div className="flex items-center gap-2">
                {selected && getFileIcon(selected)}
                <span className="font-mono text-[11px] text-slate-300 truncate">
                  {selected || "Select file..."}
                </span>
                <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                  editable
                </span>
              </div>

              {/* Preferences */}
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 mr-1.5 font-mono text-[9px] font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => setViewMode("code")}
                    className={`rounded px-2.5 py-1 transition-all duration-150 ${
                      viewMode === "code" 
                        ? "bg-sky-500 text-slate-950 shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Code
                  </button>
                  {selected && selected.endsWith(".html") && (
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      className={`rounded px-2.5 py-1 transition-all duration-150 ${
                        viewMode === "preview" 
                          ? "bg-sky-500 text-slate-950 shadow" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewMode("tests")}
                    className={`rounded px-2.5 py-1 transition-all duration-150 ${
                      viewMode === "tests" 
                        ? "bg-sky-500 text-slate-950 shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Test Suite
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setWordWrap(!wordWrap)}
                  title="Toggle Word Wrap"
                  className={`rounded p-1.5 transition ${
                    wordWrap ? "bg-sky-500/15 text-sky-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10m-10 6h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy File"
                  className={`inline-flex items-center justify-center rounded p-1.5 transition ${
                    copied ? "bg-emerald-500/15 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {copied ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Monaco Component, Live Preview, or Test Suite */}
            <div className="flex-1 min-h-[360px] max-h-[460px] overflow-y-auto select-text bg-slate-950 p-4 scrollbar-thin">
              {viewMode === "tests" ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1 pb-2 border-b border-slate-900">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-sky-400">Automated Testing</span>
                    <h5 className="text-xs font-bold text-slate-300">Run Validation Test Cases</h5>
                  </div>
                  
                  <div className="space-y-3">
                    {testCases.map((tc, idx) => {
                      const state = testStates[idx] || { status: "idle", logs: "", output: null };
                      const isLogsOpen = !!openTestLogs[idx];
                      const isOutputsOpen = !!openTestOutputs[idx];
                      
                      let statusBadge = "bg-slate-900 text-slate-500 border-slate-900";
                      if (state.status === "running") statusBadge = "bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse";
                      else if (state.status === "passed") statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      else if (state.status === "failed") statusBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                      
                      return (
                        <div key={idx} className="border border-slate-900 rounded-2xl p-4 bg-slate-950/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                              <span className="text-xs font-bold text-white">{tc.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {state.duration && (
                                <span className="font-mono text-[10px] text-slate-500">Duration: {state.duration}</span>
                              )}
                              <span className={`rounded-lg px-2.5 py-1 text-[9px] font-mono font-bold uppercase border ${statusBadge}`}>
                                {state.status}
                              </span>
                              <button
                                type="button"
                                disabled={state.status === "running"}
                                onClick={() => runTestCase(idx, tc)}
                                className="rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 active:scale-95 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-all"
                              >
                                {state.status === "running" ? "Running..." : "Run Test"}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">Input Payload</span>
                            <pre className="w-full text-[9px] bg-slate-900/60 border border-slate-900 rounded-xl p-3 font-mono text-slate-400 leading-relaxed overflow-x-auto">
                              {JSON.stringify(tc.input_data, null, 2)}
                            </pre>
                          </div>
                          
                          {state.output && (
                            <div className="space-y-1.5 border-t border-slate-900/60 pt-2.5">
                              <button
                                type="button"
                                onClick={() => setOpenTestOutputs(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="flex items-center gap-1.5 text-[8.5px] font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200"
                              >
                                <svg className={`h-3 w-3 transform transition-transform ${isOutputsOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                View Test Outcomes
                              </button>
                              
                              {isOutputsOpen && (
                                <pre className="w-full text-[9px] bg-slate-900/60 border border-slate-900 rounded-xl p-3 font-mono text-emerald-400 leading-relaxed overflow-x-auto">
                                  {JSON.stringify(state.output, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                          
                          {state.logs && (
                            <div className="space-y-1.5 border-t border-slate-900/60 pt-2.5">
                              <button
                                type="button"
                                onClick={() => setOpenTestLogs(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="flex items-center gap-1.5 text-[8.5px] font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200"
                              >
                                <svg className={`h-3 w-3 transform transition-transform ${isLogsOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                View Live Runner Console Logs
                              </button>
                              
                              {isLogsOpen && (
                                <pre className="w-full max-h-[160px] text-[8.5px] bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-slate-400 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                                  {state.logs}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selected ? (
                viewMode === "preview" && selected.endsWith(".html") ? (
                  <iframe
                    srcDoc={activeContent}
                    sandbox="allow-scripts allow-modals allow-same-origin"
                    className="w-full h-[360px] border-0 bg-slate-900 rounded-b-xl"
                  />
                ) : (
                  <div className="w-full h-[360px] overflow-hidden rounded-b-xl">
                    <Editor
                      height="360px"
                      theme="vs-dark"
                      language={
                        selected.endsWith(".py") ? "python" : 
                        selected.endsWith(".json") ? "json" : 
                        selected.endsWith(".txt") ? "plaintext" : 
                        selected.endsWith(".md") ? "markdown" : 
                        selected.endsWith(".html") ? "html" : "plaintext"
                      }
                      value={activeContent}
                      onChange={handleEditorChange}
                      options={{
                        fontSize: 12,
                        fontFamily: "IBM Plex Mono, monospace",
                        minimap: { enabled: false },
                        wordWrap: wordWrap ? "on" : "off",
                        lineNumbers: "on",
                        scrollbar: { vertical: "visible", horizontal: "visible" },
                        padding: { top: 12, bottom: 12 },
                        readOnly: false,
                        automaticLayout: true
                      }}
                    />
                  </div>
                )
              ) : (
                <div className="text-slate-600 italic select-none p-4">No file selected.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
          Source code offline. Start generation to compile workspace assets.
        </div>
      )}
    </Sheet>
  );
}
