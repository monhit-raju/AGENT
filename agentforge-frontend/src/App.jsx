import { useState } from "react";
import { 
  generateSystem, 
  continueGeneration, 
  refineSystem, 
  runSimulation,
  explainSystem 
} from "./api.js";
import SidebarNav from "./components/SidebarNav.jsx";
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
import SimulationCanvas from "./components/SimulationCanvas.jsx";

const pipelineStages = [
  "Business Understanding",
  "Agent Planner",
  "Workflow Designer",
  "Validation",
  "Prompt Generator",
  "Tool Selector",
  "Code Generator",
];

const STAGE_MAP = {
  "business_understanding": 0,
  "agent_planner": 1,
  "workflow_designer": 2,
  "workflow_validator": 3,
  "prompt_generator": 4,
  "tool_selector": 5,
  "code_generator": 6
};

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("build");
  const [activeSubTab, setActiveSubTab] = useState("spec");
  const [streamActiveIndex, setStreamActiveIndex] = useState(-1);
  const [streamDoneCount, setStreamDoneCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Advanced Extensions States
  const [refinementInput, setRefinementInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [simInput, setSimInput] = useState('{\n  "input_data": {\n    "message": "Verify this invoice transaction"\n  }\n}');
  const [simLogs, setSimLogs] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [activeSimNode, setActiveSimNode] = useState(null);
  const [completedSimNodes, setCompletedSimNodes] = useState(new Set());
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your Architect Copilot. Ask me any question about the generated agents, their tools, prompts, or workflow connections.' }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  const handleChunk = (chunk) => {
    setOutput((prev) => {
      const tag = chunk.stage ? `[${chunk.stage} - ${chunk.status}]` : `[status: ${chunk.status}]`;
      const dataStr = JSON.stringify(chunk, null, 2);
      return prev ? `${prev}\n\n${tag}\n${dataStr}` : `${tag}\n${dataStr}`;
    });

    if (chunk.stage) {
      const idx = STAGE_MAP[chunk.stage];
      if (idx !== undefined) {
        if (chunk.status === "running") {
          setStreamActiveIndex(idx);
          setStreamDoneCount(idx);
        } else if (chunk.status === "complete") {
          setStreamActiveIndex(idx + 1 < pipelineStages.length ? idx + 1 : -1);
          setStreamDoneCount(idx + 1);

          setResult((prev) => {
            const base = prev || {};
            if (chunk.stage === "business_understanding") {
              return {
                ...base,
                business_spec: chunk.result.business_spec,
                confidence_score: chunk.result.confidence,
              };
            } else if (chunk.stage === "agent_planner") {
              return { ...base, architecture: chunk.result };
            } else if (chunk.stage === "workflow_designer") {
              return { ...base, workflow: chunk.result };
            } else if (chunk.stage === "workflow_validator") {
              return { ...base, validation_report: chunk.result };
            } else if (chunk.stage === "prompt_generator") {
              return { ...base, prompts: chunk.result };
            } else if (chunk.stage === "tool_selector") {
              return { ...base, tool_selection: chunk.result };
            } else if (chunk.stage === "code_generator") {
              return { ...base, generated_code: chunk.result };
            }
            return base;
          });
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setErrorMsg("Please enter a project idea before generating.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setStreamActiveIndex(0);
    setStreamDoneCount(0);
    setResult(null);
    setSimLogs("");
    setOutput("Initializing socket connection to pipeline agent...");

    let finalPayload = null;

    try {
      await generateSystem(userInput.trim(), (chunk) => {
        handleChunk(chunk);
        if (chunk.status === "needs_clarification") {
          finalPayload = chunk;
        } else if (chunk.status === "complete") {
          finalPayload = chunk;
        }
      });

      if (finalPayload) {
        if (finalPayload.status === "needs_clarification") {
          setResult(finalPayload);
          setQuestions(finalPayload.questions || []);
          setStatus("needs_clarification");
        } else if (finalPayload.status === "complete" && finalPayload.context) {
          setResult(finalPayload.context);
          setQuestions([]);
          setStatus("complete");
        }
      } else {
        throw new Error("No payload completion status returned from backend.");
      }
    } catch (err) {
      const body = err?.body ? JSON.stringify(err.body, null, 2) : "";
      setErrorMsg(err.message || "An exception occurred while connecting to the core pipeline.");
      setOutput((prev) => `${prev}\n\nError: ${err.message}\n${body}`);
      setStatus("error");
    }
  };

  const handleClarificationSubmit = async (answers) => {
    setStatus("loading");
    setErrorMsg("");
    setStreamActiveIndex(0);
    setStreamDoneCount(0);
    setOutput("Submitting responses and re-indexing spec confidence...");

    let finalPayload = null;

    try {
      await continueGeneration(userInput.trim(), answers, (chunk) => {
        handleChunk(chunk);
        if (chunk.status === "needs_clarification") {
          finalPayload = chunk;
        } else if (chunk.status === "complete") {
          finalPayload = chunk;
        }
      });

      if (finalPayload) {
        if (finalPayload.status === "needs_clarification") {
          setResult(finalPayload);
          setQuestions(finalPayload.questions || []);
          setStatus("needs_clarification");
        } else if (finalPayload.status === "complete" && finalPayload.context) {
          setResult(finalPayload.context);
          setQuestions([]);
          setStatus("complete");
        }
      } else {
        throw new Error("Empty payload returned from pipeline resumption.");
      }
    } catch (err) {
      const body = err?.body ? JSON.stringify(err.body, null, 2) : "";
      setErrorMsg(err.message || "An exception occurred during pipeline resumption.");
      setOutput((prev) => `${prev}\n\nError: ${err.message}\n${body}`);
      setStatus("error");
    }
  };

  // Direct Code Edits Handlers
  const handleCodeChange = (fileName, content) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        generated_code: {
          ...prev.generated_code,
          [fileName]: content
        }
      };
    });
  };

  const handleWorkflowChange = (newWorkflow) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workflow: newWorkflow
      };
    });
  };

  // Refine Codebase Chat Submission
  const handleRefineSubmit = async () => {
    if (!refinementInput.trim() || refining || !result) return;
    setRefining(true);
    setErrorMsg("");
    setOutput((prev) => `${prev}\n\n[SYSTEM] Dispatching structural refinement request...`);
    try {
      const res = await refineSystem(
        result.generated_code,
        result.business_spec,
        result.architecture,
        result.workflow,
        refinementInput.trim()
      );
      if (res.status === "complete" && res.result) {
        setResult((prev) => ({
          ...prev,
          generated_code: res.result.generated_code,
          architecture: res.result.architecture,
          workflow: res.result.workflow
        }));
        setOutput((prev) => `${prev}\n[SYSTEM] Refactoring complete! Agent list, workflow maps, and source files synchronized.`);
        setRefinementInput("");
      }
    } catch (e) {
      setErrorMsg(e.message);
      setOutput((prev) => `${prev}\n[SYSTEM] Refactoring failed: ${e.message}`);
    } finally {
      setRefining(false);
    }
  };

  // Live Sandbox Subprocess Simulation Runner
  const handleSimulateSubmit = async () => {
    if (simulating || !result) return;
    setSimulating(true);
    setActiveSimNode(null);
    setCompletedSimNodes(new Set());
    setSimLogs("Initializing pipeline execution subprocess sandbox...\n");
    
    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(simInput);
      } catch (err) {
        setSimLogs((prev) => prev + `[SIMULATOR ERROR] Invalid Payload JSON syntax: ${err.message}\n`);
        setSimulating(false);
        return;
      }

      await runSimulation(result.generated_code, parsedInput, (chunk) => {
        const text = chunk?.output || "";
        if (text) {
          setSimLogs((prev) => prev + text);
          
          // Parse start token: e.g. [AGENT_START] planner
          if (text.includes("[AGENT_START]")) {
            const match = text.match(/\[AGENT_START\]\s+([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              setActiveSimNode(match[1]);
            }
          }
          // Parse end token: e.g. [AGENT_END] planner
          if (text.includes("[AGENT_END]")) {
            const match = text.match(/\[AGENT_END\]\s+([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const completedNode = match[1];
              setActiveSimNode(null);
              setCompletedSimNodes((prev) => {
                const next = new Set(prev);
                next.add(completedNode);
                return next;
              });
            }
          }
        }
      });
    } catch (e) {
      setSimLogs((prev) => prev + `\n[SIMULATOR ERROR] Run aborted: ${e.message}\n`);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopilotSubmit = async () => {
    if (!copilotInput.trim() || copilotLoading || !result) return;
    const userMsg = copilotInput.trim();
    setCopilotInput("");
    setCopilotMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setCopilotLoading(true);
    setCopilotMessages((prev) => [...prev, { sender: 'bot', text: "" }]);
    
    try {
      await explainSystem(
        result.generated_code,
        result.business_spec,
        result.architecture,
        result.workflow,
        userMsg,
        (chunk) => {
          const text = chunk?.output || "";
          if (text) {
            setCopilotMessages((prev) => {
              const next = [...prev];
              const lastMsg = next[next.length - 1];
              lastMsg.text += text;
              return next;
            });
          }
        }
      );
    } catch (e) {
      setCopilotMessages((prev) => {
        const next = [...prev];
        const lastMsg = next[next.length - 1];
        lastMsg.text = `[COPILOT ERROR] Failed to retrieve explanation: ${e.message}`;
        return next;
      });
    } finally {
      setCopilotLoading(false);
    }
  };

  const isLoading = status === "loading";
  const doneCount = status === "complete" ? pipelineStages.length : status === "loading" ? streamDoneCount : 0;
  const activeIndex = status === "loading" ? streamActiveIndex : -1;
  const agentCount = result?.architecture?.agents?.length || 0;
  const fileCount = Object.keys(result?.generated_code || {}).length;
  const toolCount = Object.keys(result?.tool_selection?.overall_stack || {}).length;

  const subTabs = [
    { id: "spec", label: "Blueprint Spec" },
    { id: "agents", label: "Agent Nodes" },
    { id: "workflow", label: "Workflow Map" },
    { id: "tools", label: "Tool Stack" },
    { id: "prompts", label: "Prompts" },
    { id: "copilot", label: "Q&A Copilot" },
    { id: "simulate", label: "Live Simulator" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-body">
      {/* 1. Sidebar Nav (Desktop) */}
      <div className="hidden md:block w-72 shrink-0 h-full">
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} status={status} />
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Nav Header */}
        <header className="md:hidden flex items-center justify-between border-b border-slate-900 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-display font-bold text-white text-sm">AgentForge</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </header>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-b border-slate-900 bg-slate-950/95 px-6 py-4 space-y-3 z-50">
            <button
              onClick={() => { setActiveTab("build"); setMobileMenuOpen(false); }}
              className={`block w-full py-2 text-left text-sm font-semibold ${activeTab === "build" ? "text-sky-400" : "text-slate-300"}`}
            >
              Architect Workspace
            </button>
            <button
              onClick={() => { setActiveTab("output"); setMobileMenuOpen(false); }}
              className={`block w-full py-2 text-left text-sm font-semibold ${activeTab === "output" ? "text-sky-400" : "text-slate-300"}`}
            >
              Logs Terminal
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
              className={`block w-full py-2 text-left text-sm font-semibold ${activeTab === "settings" ? "text-sky-400" : "text-slate-300"}`}
            >
              API Settings
            </button>
            <button
              onClick={() => { setActiveTab("about"); setMobileMenuOpen(false); }}
              className={`block w-full py-2 text-left text-sm font-semibold ${activeTab === "about" ? "text-sky-400" : "text-slate-300"}`}
            >
              Documentation
            </button>
          </nav>
        )}

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB: BUILD (ARCHITECT WORKSPACE) */}
          {activeTab === "build" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              {/* Idle State: Center-focused prompt screen */}
              {status === "idle" && (
                <div className="space-y-6 max-w-4xl mx-auto py-12">
                  <div className="text-center space-y-3 mb-10">
                    <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                      Forge Multi-Agent Systems
                    </h1>
                    <p className="max-w-2xl mx-auto text-base text-slate-400 leading-relaxed">
                      Transform generic project descriptions into functional system requirements, workflows, agent task lists, and boilerplate code contexts.
                    </p>
                  </div>
                  <InputPanel value={userInput} onChange={setUserInput} onSubmit={handleGenerate} isLoading={isLoading} />
                </div>
              )}

              {/* Generating / Completed / Interactive Workspace States */}
              {status !== "idle" && (
                <div className="space-y-6">
                  {/* IDE Workspace Top Bar Status */}
                  <div className="glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                        {isLoading ? (
                          <svg className="h-5 w-5 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : status === "needs_clarification" ? (
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        ) : status === "complete" ? (
                          <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-bold text-white text-sm">Orchestrator Workspace</h2>
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                            status === "loading" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                            status === "needs_clarification" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            status === "complete" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {status === "loading" ? "Running" : status === "needs_clarification" ? "Interrupted" : status === "complete" ? "Finished" : "Failure"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[280px] md:max-w-md">
                          Input: "{userInput}"
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    {status === "complete" && (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-xl bg-slate-900/60 border border-slate-900 px-3.5 py-2 text-center">
                          <p className="text-[9px] font-mono text-slate-500 uppercase">Agents</p>
                          <p className="text-sm font-bold text-white mt-0.5">{agentCount}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/60 border border-slate-900 px-3.5 py-2 text-center">
                          <p className="text-[9px] font-mono text-slate-500 uppercase">Files</p>
                          <p className="text-sm font-bold text-white mt-0.5">{fileCount}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/60 border border-slate-900 px-3.5 py-2 text-center">
                          <p className="text-[9px] font-mono text-slate-500 uppercase">APIs</p>
                          <p className="text-sm font-bold text-white mt-0.5">{toolCount}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Errors */}
                  {status === "error" && errorMsg && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-300 shadow-md">
                      <div className="flex gap-2">
                        <svg className="h-5 w-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="font-bold">Pipeline Compilation Failure</p>
                          <p className="mt-1 text-xs text-rose-400/90 leading-relaxed font-mono">{errorMsg}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Split Screen IDE Workspace */}
                  <div className="grid gap-6 lg:grid-cols-2 items-start">
                    
                    {/* LEFT PANE: Systems Specifications Explorer */}
                    <div className="space-y-6">
                      
                      {/* Sub-tab Selectors */}
                      {status !== "needs_clarification" && (
                        <div className="flex overflow-x-auto gap-2 bg-slate-950/60 border border-slate-900 rounded-2xl p-1.5 scrollbar-thin">
                          {subTabs.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setActiveSubTab(sub.id)}
                              className={`rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 transition-all duration-150 ${
                                activeSubTab === sub.id
                                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10"
                                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Loading Pipeline View */}
                      {isLoading && (
                        <PipelineTrace activeIndex={activeIndex} doneCount={doneCount} />
                      )}

                      {/* Clarification Resumption Flow */}
                      {status === "needs_clarification" && (
                        <div className="space-y-6">
                          <ClarificationPanel questions={questions} onSubmit={handleClarificationSubmit} isLoading={isLoading} />
                          {result?.business_spec && (
                            <div className="glass-panel rounded-3xl p-6 space-y-4">
                              <h3 className="font-display font-bold text-white text-base">Current Extraction</h3>
                              <div className="rounded-xl bg-slate-950/60 border border-slate-900 p-4 font-body text-xs text-slate-300 leading-relaxed">
                                <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1">Assumption Goal</span>
                                {result.business_spec.goal}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Compiled Sheets Display */}
                      {status === "complete" && result && (
                        <div className="transition-all duration-300 space-y-6">
                          {/* Main SubTab Content panels */}
                          {activeSubTab === "spec" && <BusinessSheet businessSpec={result.business_spec} />}
                          {activeSubTab === "agents" && <AgentsSheet architecture={result.architecture} />}
                          {activeSubTab === "workflow" && <WorkflowSheet workflow={result.workflow} onWorkflowChange={handleWorkflowChange} />}
                          {activeSubTab === "tools" && <ToolsSheet toolSelection={result.tool_selection} architecture={result.architecture} />}
                          {activeSubTab === "prompts" && <PromptsSheet prompts={result.prompts} architecture={result.architecture} />}
                          
                          {/* Q&A Copilot SubTab */}
                          {activeSubTab === "copilot" && (
                            <div className="glass-panel rounded-3xl p-6 space-y-5 flex flex-col h-[520px] justify-between">
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-sky-400">Assistant</span>
                                <h3 className="font-display text-lg font-bold text-white">Architect Copilot</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                  Ask questions about the active agent specifications, prompt strategies, tool allocation, or workflow linkages.
                                </p>
                              </div>

                              {/* Chat Message Window */}
                              <div className="flex-1 overflow-y-auto space-y-3 bg-slate-950/60 border border-slate-900 rounded-2xl p-4 my-2 scrollbar-thin">
                                {copilotMessages.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                      msg.sender === 'user' 
                                        ? 'bg-sky-500 text-slate-950 font-bold rounded-tr-none' 
                                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                                    }`}>
                                      {msg.text || (
                                        <div className="flex items-center gap-1 py-1">
                                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Input Form */}
                              <div className="flex gap-2.5 shrink-0 pt-2 border-t border-slate-900">
                                <input
                                  type="text"
                                  value={copilotInput}
                                  onChange={(e) => setCopilotInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSubmit(); }}
                                  disabled={copilotLoading}
                                  placeholder="e.g. What APIs are assigned to the validator agent?"
                                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-sky-500 transition-all"
                                />
                                <button
                                  onClick={handleCopilotSubmit}
                                  disabled={copilotLoading || !copilotInput.trim()}
                                  className="rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-40 disabled:scale-100 shrink-0 inline-flex items-center gap-1.5"
                                >
                                  {copilotLoading ? (
                                    <svg className="h-4 w-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Live Simulator SubTab */}
                          {activeSubTab === "simulate" && (
                            <div className="glass-panel rounded-3xl p-6 space-y-5">
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-sky-400">Sandbox</span>
                                <h3 className="font-display text-lg font-bold text-white">Live Pipeline Execution</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                  Run the generated Python modules in a sandbox subprocess and watch agent collaboration live.
                                </p>
                              </div>

                              {/* Visualization Canvas */}
                              {result?.architecture?.agents && (
                                <div className="border border-slate-900/60 rounded-2xl bg-slate-950/40 p-4">
                                  <SimulationCanvas 
                                    agents={result.architecture.agents}
                                    activeAgentId={activeSimNode}
                                    completedAgents={completedSimNodes}
                                    simLogs={simLogs}
                                  />
                                </div>
                              )}

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                                    Mock Input Data (JSON)
                                  </label>
                                  <textarea
                                    value={simInput}
                                    onChange={(e) => setSimInput(e.target.value)}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-xs text-slate-300 outline-none focus:border-sky-500"
                                  />
                                </div>
                                <button
                                  onClick={handleSimulateSubmit}
                                  disabled={simulating}
                                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 transition-all px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                >
                                  {simulating ? (
                                    <>
                                      <svg className="h-4 w-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      <span>Running Simulation Sandbox...</span>
                                    </>
                                  ) : (
                                    <span>Run Simulation Sandbox</span>
                                  )}
                                </button>
                              </div>

                              {simLogs && (
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                                    Simulation Console Logs
                                  </label>
                                  <pre className="w-full max-h-[160px] overflow-y-auto bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[9px] text-emerald-400 leading-relaxed whitespace-pre-wrap">
                                    {simLogs}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Code Refinement Chat input box (displayed under explorer unless in simulate tab) */}
                          {activeSubTab !== "simulate" && (
                            <div className="glass-panel rounded-3xl p-5 border border-sky-500/10 shadow-[0_0_15px_-4px_rgba(56,189,248,0.08)]">
                              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-2">
                                Refine System Architecture
                              </p>
                              <div className="flex gap-2.5">
                                <input
                                  type="text"
                                  value={refinementInput}
                                  onChange={(e) => setRefinementInput(e.target.value)}
                                  disabled={refining}
                                  placeholder="e.g. Add logging scripts to agents, or add validation rules..."
                                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-sky-500 transition-all"
                                />
                                <button
                                  onClick={handleRefineSubmit}
                                  disabled={refining || !refinementInput.trim()}
                                  className="rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-40 disabled:scale-100 shrink-0 inline-flex items-center gap-1.5"
                                >
                                  {refining ? (
                                    <>
                                      <svg className="h-3.5 w-3.5 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      <span>Refining...</span>
                                    </>
                                  ) : (
                                    <span>Refine</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANE: Code workbench */}
                    <div>
                      <CodeSheet 
                        generatedCode={result?.generated_code} 
                        validationReport={result?.validation_report} 
                        onCodeChange={handleCodeChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: OUTPUT CONSOLE */}
          {activeTab === "output" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <OutputPanel output={output} onClear={() => setOutput("")} />
              
              <div className="glass-panel rounded-3xl p-6 space-y-3">
                <h3 className="font-display font-bold text-white text-sm">Streaming Diagnostics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The logs console streams background activities from the agent forge core pipeline. These events capture the raw responses emitted by the local LLM clients at each compiler stage. If validation alerts or generation warnings block synthesis, analyze the line logs above for exact stack details.
                </p>
              </div>
            </div>
          )}

          {/* TAB: CONNECTION SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <SettingsPanel onChange={() => {}} />
              
              <div className="glass-panel rounded-3xl p-6 space-y-3">
                <h3 className="font-display font-bold text-white text-sm">Local Server Manual</h3>
                <ul className="list-decimal pl-5 space-y-2 text-xs text-slate-400 leading-relaxed">
                  <li>Configure the endpoint to match the local FastAPI compiler client port (Default is <code className="font-mono text-sky-400 bg-sky-500/5 px-1 py-0.5 rounded border border-sky-500/10">http://127.0.0.1:8000</code>).</li>
                  <li>Enter the server credentials header key Sk-key if connecting to custom cloud APIs.</li>
                  <li>Press the save trigger to apply settings instantly and verify connection integrity with the indicator lights.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: ABOUT PAGE */}
          {activeTab === "about" && (
            <div className="max-w-3xl mx-auto space-y-6 py-6">
              <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-sky-400">Documentation</span>
                <h2 className="font-display text-2xl font-bold text-white">System Architecture Blueprinting</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AgentForge is a modular code synthesis workbench designed to draft software specifications, design workflow topologies, generate system prompts, allocate specific API toolkits, and validate final boilerplate files. 
                </p>
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-900">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-200">1. Specification Compiler</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Translates abstract natural language ideas into structured objectives, categorizing domains and constraints before architecture planning.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-200">2. Topology Mapping</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Models communication pathways and data triggers between AI agents using animated graphs representing pipeline validation vectors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6 space-y-3">
                <h3 className="font-display font-bold text-white text-sm">Security & Storage Integrity</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Saved settings and credentials keys are persisted client-side in the local secure context of your browser's localStorage. No authentication fields or parameters are ever sent to external databases or tracker metrics.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
