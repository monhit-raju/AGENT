import { useState } from "react";
import { generateSystem, continueGeneration } from "./api.js";
import InputPanel from "./components/InputPanel.jsx";
import ClarificationPanel from "./components/ClarificationPanel.jsx";
import PipelineTrace from "./components/PipelineTrace.jsx";
import BusinessSheet from "./components/BusinessSheet.jsx";
import AgentsSheet from "./components/AgentsSheet.jsx";
import WorkflowSheet from "./components/WorkflowSheet.jsx";
import PromptsSheet from "./components/PromptsSheet.jsx";
import ToolsSheet from "./components/ToolsSheet.jsx";
import CodeSheet from "./components/CodeSheet.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import OutputPanel from "./components/OutputPanel.jsx";

const pipelineStages = [
  "Business Understanding",
  "Agent Planner",
  "Workflow Designer",
  "Validation",
  "Prompt Generator",
  "Tool Selector",
  "Code Generator",
];

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("build");
  const tabs = [
    { id: "build", label: "Build" },
    { id: "output", label: "Output" },
    { id: "settings", label: "Settings" },
    { id: "about", label: "About" },
  ];

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setErrorMsg("Please enter a project idea before generating.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    try {
      setOutput("Sending request to API...");
      const data = await generateSystem(userInput.trim());
      setResult(data);
      setQuestions(data.questions || []);
      setOutput(JSON.stringify(data, null, 2));
      if (data.status === "needs_clarification") {
        setStatus("needs_clarification");
      } else {
        setStatus("complete");
      }
    } catch (err) {
      const body = err?.body ? JSON.stringify(err.body, null, 2) : "";
      setErrorMsg(err.message || "Something went wrong talking to the backend.");
      setOutput(`${err.message}\n${body}`);
      setStatus("error");
    }
  };

  const handleClarificationSubmit = async (answers) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      setOutput("Sending clarification answers to API...");
      const data = await continueGeneration(userInput.trim(), answers);
      setResult(data);
      setQuestions([]);
      setOutput(JSON.stringify(data, null, 2));
      setStatus("complete");
    } catch (err) {
      const body = err?.body ? JSON.stringify(err.body, null, 2) : "";
      setErrorMsg(err.message || "Something went wrong talking to the backend.");
      setOutput(`${err.message}\n${body}`);
      setStatus("error");
    }
  };

  const isLoading = status === "loading";
  const doneCount = status === "complete" ? pipelineStages.length : status === "loading" ? 1 : 0;
  const activeIndex = isLoading ? 0 : -1;
  const agentCount = result?.architecture?.agents?.length || 0;
  const fileCount = Object.keys(result?.generated_code || {}).length;
  const toolCount = Object.keys(result?.tool_selection?.overall_stack || {}).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(99,199,255,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(94,234,212,0.08),_transparent_30%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

      <header className="relative overflow-hidden border-b border-slate-800/80 bg-slate-950/95 px-6 py-10 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_35%)]" />
        <div className="mx-auto relative max-w-6xl space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-700/80">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                API ready
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400/80">Intelligent system builder</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">From prompt to multi-agent architecture.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                  Describe your idea and the system will generate business requirements, agent structure, workflow design, prompts, tool recommendations, and starter code.
                </p>
              </div>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-1">
              <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-5 shadow-xl shadow-slate-950/20">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Status</p>
                <p className="mt-3 text-2xl font-semibold text-white">{status === "idle" ? "Ready" : status === "loading" ? "Generating" : status === "needs_clarification" ? "Clarification" : status === "complete" ? "Complete" : "Error"}</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-5 shadow-xl shadow-slate-950/20">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Quick stats</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-900/90 p-3 text-center">
                    <p className="text-sm text-slate-400">Agents</p>
                    <p className="mt-2 text-xl font-semibold text-white">{agentCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/90 p-3 text-center">
                    <p className="text-sm text-slate-400">Files</p>
                    <p className="mt-2 text-xl font-semibold text-white">{fileCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/90 p-3 text-center">
                    <p className="text-sm text-slate-400">Tools</p>
                    <p className="mt-2 text-xl font-semibold text-white">{toolCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-12 pt-10">
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/80 p-2 shadow-lg shadow-slate-950/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "bg-sky-500 text-slate-950" : "bg-slate-900/70 text-slate-300 hover:bg-slate-800"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "build" && (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
            <div className="space-y-6">
              <InputPanel value={userInput} onChange={setUserInput} onSubmit={handleGenerate} isLoading={isLoading} />

              {status === "error" && errorMsg && (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100 shadow-lg shadow-rose-500/5">
                  {errorMsg}
                </div>
              )}

              {(isLoading || status === "complete") && <PipelineTrace activeIndex={activeIndex} doneCount={doneCount} />}

              {status === "complete" && result && (
                <div className="space-y-6">
                  <BusinessSheet businessSpec={result.business_spec} />
                  <AgentsSheet architecture={result.architecture} />
                  <WorkflowSheet workflow={result.workflow} />
                  <PromptsSheet prompts={result.prompts} architecture={result.architecture} />
                  <ToolsSheet toolSelection={result.tool_selection} architecture={result.architecture} />
                  <CodeSheet generatedCode={result.generated_code} validationReport={result.validation_report} userInput={userInput} />
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Pipeline overview</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  The backend will analyze your prompt, create a structured agent workflow, choose tooling, and generate code assets dynamically.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3">
                    <span className="text-sm text-slate-400">Clarification needed</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "needs_clarification" ? "bg-amber-500/10 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
                      {status === "needs_clarification" ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3">
                    <span className="text-sm text-slate-400">Current request</span>
                    <span className="text-sm text-slate-300">{userInput ? "Ready" : "Waiting"}</span>
                  </div>
                </div>
              </div>

              {status === "needs_clarification" && (
                <ClarificationPanel questions={questions} onSubmit={handleClarificationSubmit} isLoading={isLoading} />
              )}

              {status === "needs_clarification" && result?.business_spec && (
                <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
                  <h2 className="text-lg font-semibold text-white">Business summary</h2>
                  <p className="mt-3 text-sm text-slate-400">This is the current context extracted from your prompt.</p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-[1.5rem] bg-slate-900/90 p-4 ring-1 ring-slate-800/70">
                      <p className="text-sm text-slate-400">Goal</p>
                      <p className="mt-2 text-slate-100">{result.business_spec.goal}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] bg-slate-900/90 p-4 ring-1 ring-slate-800/70">
                        <p className="text-sm text-slate-400">Domain</p>
                        <p className="mt-2 text-slate-100">{result.business_spec.domain || "General"}</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-slate-900/90 p-4 ring-1 ring-slate-800/70">
                        <p className="text-sm text-slate-400">Confidence score</p>
                        <p className="mt-2 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{result.business_spec.confidence}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {activeTab === "output" && (
          <div className="space-y-6">
            <OutputPanel output={output} onClear={() => setOutput("")} />
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Live response timeline</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                The output panel captures the API response and any backend errors so you can inspect the full payload without leaving the UI.
              </p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <SettingsPanel onChange={() => {}} />
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">How to use</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-400">
                <li>Enter your backend URL, such as http://127.0.0.1:8000.</li>
                <li>Optionally add a bearer token or API key if your backend expects one.</li>
                <li>Switch back to Build and generate a project from the same screen.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">About this experience</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                This UI now works like a small multi-tab workspace: Build for generation, Output for API responses, Settings for connection details, and About for usage and security notes.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Security note</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                API keys saved in the browser are fine for local demos, but production deployments should keep secrets server-side to avoid exposing them in client storage.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
