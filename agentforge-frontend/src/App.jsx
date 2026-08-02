import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  generateSystem, 
  continueGeneration, 
  refineSystem, 
  runSimulation,
  explainSystem 
} from "./api.js";
import MonacoEditor from "@monaco-editor/react";
import ClarificationPanel from "./components/ClarificationPanel.jsx";
import SimulationCanvas from "./components/SimulationCanvas.jsx";
import WorkflowSheet from "./components/WorkflowSheet.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { 
  Terminal, Settings, Layers, Play, ArrowRight, Search, Bell, User, Plus, 
  Cpu, Coins, Activity, FileCode, Trash2, HelpCircle, Send, Database, 
  Sparkles, ShieldAlert, Globe, ChevronRight, ChevronLeft, Check, Code, 
  Workflow, AlertTriangle, Info, PlayCircle, RefreshCw, Download, FileText, CheckCircle2, Bot
} from "lucide-react";

const pipelineStages = [
  "Business Specification Auditor",
  "Context Clarification Interviewer",
  "Multi-Agent System Architect",
  "System Identity & Conflict Resolver",
  "Workflow Topology Designer",
  "Workflow Deadlock Validator",
  "Workflow Latency Optimizer",
  "Prompt Synthesis Engineer",
  "Prompt Quality Assurance Inspector",
  "Core Tool Capability Mapper",
  "Tool OpenAPI Schema Validator",
  "Database Schema Architect",
  "Schema Migration & Seed Planner",
  "Python Boilerplate Generator",
  "REST API Endpoints Builder",
  "Core Algorithm Logic Engineer",
  "Environment Configuration Builder",
  "UI Component Designer",
  "UI Accessibility & Layout Inspector",
  "Pytest Unit Test Suite Planner",
  "Mock Payload & Fixture Synthesizer",
  "Technical API Documentation Writer",
  "Mermaid Graph Diagrammer",
  "OWASP Security Auditor",
  "Credential & Secret Leak Guard",
  "Supply-Chain Vulnerability Scanner",
  "Python Syntax & Style Healer",
  "Performance Bottleneck Analyzer",
  "Deployment Manifest Validator",
  "Compilation Final Report Compiler"
];

const STAGE_MAP = {
  "business_understanding": 0,
  "clarification_agent": 1,
  "agent_planner": 2,
  "agent_role_verifier": 3,
  "workflow_designer": 4,
  "workflow_validator": 5,
  "workflow_optimizer": 6,
  "prompt_generator": 7,
  "prompt_reviewer": 8,
  "tool_selector": 9,
  "tool_parameter_validator": 10,
  "db_architect": 11,
  "db_migration_planner": 12,
  "code_generator": 13,
  "api_endpoints_generator": 14,
  "core_logic_generator": 15,
  "environment_setup_agent": 16,
  "ui_designer": 17,
  "ui_component_reviewer": 18,
  "test_generator": 19,
  "mock_data_generator": 20,
  "doc_generator": 21,
  "architecture_diagrammer": 22,
  "security_analyzer": 23,
  "credential_leak_detector": 24,
  "dependency_auditor": 25,
  "lint_healer": 26,
  "performance_analyzer": 27,
  "package_manifest_verifier": 28,
  "compilation_report_compiler": 29
};

const FEATURES = [
  { id: "chatbot", label: "Chatbot", desc: "Interactive LLM conversation node" },
  { id: "rag", label: "RAG Engine", desc: "Knowledge retrieval vector database search" },
  { id: "multi_agent", label: "Multi-Agent Coordinator", desc: "Orchestrate complex parallel subagents" },
  { id: "auth", label: "Authentication", desc: "JWT role-based developer access control" },
  { id: "payments", label: "Payments", desc: "Stripe subscription billing API integration" },
  { id: "analytics", label: "Analytics", desc: "Collect prompt runs & token usage logs" },
  { id: "notifications", label: "Notifications", desc: "Auto Slack alerts or email triggers" },
  { id: "dashboard", label: "Admin Dashboard", desc: "Control panel UI to inspect status metrics" },
];

export default function App() {
  // App Core State
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("build");
  const [streamActiveIndex, setStreamActiveIndex] = useState(-1);
  const [streamDoneCount, setStreamDoneCount] = useState(0);
  const [navCollapsed, setNavCollapsed] = useState(true);

  // Form Section States
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [targetUsers, setTargetUsers] = useState("Developers");
  const [complexity, setComplexity] = useState(60);
  const [llmProvider, setLlmProvider] = useState("gemini");
  const [budget, setBudget] = useState("$50 / mo");
  const [deployment, setDeployment] = useState("Fly.io");
  const [selectedFeatures, setSelectedFeatures] = useState(new Set(["chatbot", "multi_agent"]));

  // Advanced Extensions States
  const [refinementInput, setRefinementInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [simInput, setSimInput] = useState('{\n  "input_data": {\n    "message": "Verify security compliance"\n  }\n}');
  const [simLogs, setSimLogs] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [activeSimNode, setActiveSimNode] = useState(null);
  const [completedSimNodes, setCompletedSimNodes] = useState(new Set());
  
  // Copilot Chat
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your Solaris AI assistant. I can suggest architectural optimizations, calculate tokens/costs, or resolve code issues.' }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Bottom tabbed panel selection
  const [consoleTab, setConsoleTab] = useState("logs");
  const [selectedFileName, setSelectedFileName] = useState("");

  // Projects list
  const [savedProjects, setSavedProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const logsEndRef = useRef(null);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, simLogs]);

  // Project persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("agentforge_saved_builds");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedProjects(parsed);
          const lastActive = localStorage.getItem("agentforge_active_build_id");
          if (lastActive) {
            const activeProj = parsed.find(p => p && p.id === lastActive);
            if (activeProj) {
              setResult(activeProj.result);
              setActiveProjectId(activeProj.id);
              setUserInput(activeProj.userInput || "");
              if (activeProj.result?.business_spec) {
                const spec = activeProj.result.business_spec;
                setProjectName(spec.name || "");
                setProjectDesc(spec.description || "");
                setIndustry(spec.industry || "Technology");
                setTargetUsers(spec.target_users || "Developers");
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load saved projects:", e);
    }
  }, []);

  // Save current project state
  useEffect(() => {
    if (!result) return;
    let currentId = activeProjectId;
    if (!currentId) {
      currentId = "build_" + Date.now().toString(36);
      setActiveProjectId(currentId);
    }
    const name = projectName || result?.business_spec?.name || "Untitled Build";
    setSavedProjects((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const idx = arr.findIndex(p => p && p.id === currentId);
      const updated = {
        id: currentId,
        name,
        timestamp: new Date().toLocaleString(),
        result,
        userInput
      };
      let next;
      if (idx > -1) {
        next = [...arr];
        next[idx] = updated;
      } else {
        next = [updated, ...arr];
      }
      localStorage.setItem("agentforge_saved_builds", JSON.stringify(next));
      localStorage.setItem("agentforge_active_build_id", currentId);
      return next;
    });
  }, [result, projectName, activeProjectId]);

  const handleNewProject = () => {
    setResult(null);
    setActiveProjectId(null);
    setUserInput("");
    setProjectName("");
    setProjectDesc("");
    setQuestions([]);
    setStatus("idle");
    setStreamActiveIndex(-1);
    setStreamDoneCount(0);
    localStorage.removeItem("agentforge_active_build_id");
  };

  const handleLoadProject = (project) => {
    if (!project) return;
    setActiveProjectId(project.id);
    setResult(project.result);
    setUserInput(project.userInput || "");
    setStatus("complete");
    setQuestions([]);
    setStreamActiveIndex(-1);
    setStreamDoneCount(pipelineStages.length);
    if (project.result?.business_spec) {
      const spec = project.result.business_spec;
      setProjectName(spec.name || "");
      setProjectDesc(spec.description || "");
      setIndustry(spec.industry || "Technology");
      setTargetUsers(spec.target_users || "Developers");
    }
  };

  const handleDeleteProject = (projId, e) => {
    e.stopPropagation();
    setSavedProjects((prev) => {
      const filtered = prev.filter(p => p.id !== projId);
      localStorage.setItem("agentforge_saved_builds", JSON.stringify(filtered));
      return filtered;
    });
    if (activeProjectId === projId) {
      handleNewProject();
    }
  };

  // Feature Select toggle
  const toggleFeature = (fid) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) {
        next.delete(fid);
      } else {
        next.add(fid);
      }
      return next;
    });
  };

  // Compile Pipeline Handler
  const handleChunk = (chunk) => {
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
            } else if (chunk.stage === "ui_generator") {
              return { ...base, generated_code: chunk.result };
            } else if (chunk.stage === "db_architect") {
              return { ...base, generated_code: chunk.result };
            } else if (chunk.stage === "test_generator") {
              return { ...base, generated_code: chunk.result };
            } else if (chunk.stage === "doc_generator") {
              return { ...base, generated_code: chunk.result };
            } else if (chunk.stage === "security_analyzer") {
              return { ...base, generated_code: chunk.result };
            } else if (chunk.stage === "lint_healer") {
              return { ...base, generated_code: chunk.result };
            } else if (chunk.stage === "architecture_diagrammer") {
              return { ...base, generated_code: chunk.result };
            }
            return base;
          });
        }
      }
    }
  };

  const triggerBuild = async () => {
    // Verify that at least one API key is defined in local settings
    const geminiKey = localStorage.getItem("gemini_api_key");
    const groqKey = localStorage.getItem("groq_api_key");
    const openaiKey = localStorage.getItem("openai_api_key");
    const agentKey = localStorage.getItem("agent_api_key");
    if (!geminiKey && !groqKey && !openaiKey && !agentKey) {
      const proceed = window.confirm(
        "No API keys found in your browser Settings.\n\n" +
        "If your backend server has default keys configured in its .env file, click OK to proceed.\n" +
        "Otherwise, click Cancel and configure your keys in the Settings tab."
      );
      if (!proceed) {
        setActiveTab("settings");
        return;
      }
    }

    // Generate prompt input from features and sliders
    const promptDescription = `
      Project Name: ${projectName || "Unnamed system"}
      Description: ${projectDesc || "General agent hub"}
      Industry: ${industry}
      Target Users: ${targetUsers}
      Target Complexity: ${complexity}/100
      LLM Provider: ${llmProvider}
      Budget: ${budget}
      Deployment Target: ${deployment}
      Requested Core Features: ${Array.from(selectedFeatures).join(", ")}.
    `;

    setUserInput(promptDescription);
    setStatus("loading");
    setErrorMsg("");
    setStreamActiveIndex(0);
    setStreamDoneCount(0);
    setResult(null);
    setSimLogs("");
    setOutput("Initializing socket pipeline connections...");

    let finalPayload = null;
    try {
      await generateSystem(promptDescription.trim(), (chunk) => {
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
      }
    } catch (err) {
      let msg = err.message || "Compilation failed.";
      const lowMsg = msg.toLowerCase();
      if (lowMsg.includes("api key") || lowMsg.includes("api_key") || lowMsg.includes("unauthorized") || lowMsg.includes("401") || lowMsg.includes("credential")) {
        msg = "Compilation failed: API keys are missing or invalid. Please enter your API key in the Settings tab.";
      }
      setErrorMsg(msg);
      setStatus("error");
    }
  };

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

  const handleClarificationSubmit = async (answers) => {
    setStatus("loading");
    setErrorMsg("");
    setStreamActiveIndex(0);
    setStreamDoneCount(0);
    setOutput("Resubmitting clarification inputs...");
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
      }
    } catch (err) {
      setErrorMsg(err.message || "Clarification response failed.");
      setStatus("error");
    }
  };

  const handleRefineSubmit = async () => {
    if (!refinementInput.trim() || refining || !result) return;
    setRefining(true);
    setErrorMsg("");
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
        setRefinementInput("");
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setRefining(false);
    }
  };

  const handleSimulateSubmit = async () => {
    if (simulating || !result) return;
    setSimulating(true);
    setActiveSimNode(null);
    setCompletedSimNodes(new Set());
    setSimLogs("Spawning simulation process...\n");
    try {
      let parsedInput = JSON.parse(simInput);
      await runSimulation(result.generated_code, parsedInput, (chunk) => {
        const text = chunk?.output || "";
        if (text) {
          setSimLogs((prev) => prev + text);
          if (text.includes("[AGENT_START]")) {
            const match = text.match(/\[AGENT_START\]\s+([a-zA-Z0-9_-]+)/);
            if (match && match[1]) setActiveSimNode(match[1]);
          }
          if (text.includes("[AGENT_END]")) {
            const match = text.match(/\[AGENT_END\]\s+([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              setCompletedSimNodes(prev => {
                const n = new Set(prev);
                n.add(match[1]);
                return n;
              });
            }
          }
        }
      });
    } catch (e) {
      setSimLogs(prev => prev + `\n[SIMULATOR ERROR]: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopilotSubmit = async () => {
    if (!copilotInput.trim() || copilotLoading || !result) return;
    const msg = copilotInput.trim();
    setCopilotInput("");
    setCopilotMessages(prev => [...prev, { sender: "user", text: msg }]);
    setCopilotLoading(true);
    setCopilotMessages(prev => [...prev, { sender: "bot", text: "" }]);
    try {
      await explainSystem(
        result.generated_code,
        result.business_spec,
        result.architecture,
        result.workflow,
        msg,
        (chunk) => {
          const text = chunk?.output || "";
          if (text) {
            setCopilotMessages(prev => {
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), { ...last, text: last.text + text }];
            });
          }
        }
      );
    } catch (e) {
      setCopilotMessages(prev => [...prev.slice(0, -1), { sender: "bot", text: `Error: ${e.message}` }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result?.generated_code) return;
    try {
      const response = await fetch("http://localhost:8000/download-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generated_code: result.generated_code })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, "_") || "agentforge"}_project.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const isLoading = status === "loading";
  const doneCount = status === "complete" ? pipelineStages.length : status === "loading" ? streamDoneCount : 0;
  const activeIndex = status === "loading" ? streamActiveIndex : -1;

  const files = result?.generated_code || {};
  const filePaths = Object.keys(files);
  const activeCodeContent = selectedFileName ? files[selectedFileName] : "";

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#060816] text-[#ffffff] selection:bg-[#7C3AED]/40 selection:text-white">
      {/* Decorative Spatial Background mesh */}
      <div className="gradient-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Floating navigation rail */}
      <motion.div 
        className="fixed left-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl glass-card py-6 flex flex-col items-center gap-6 border border-white/5"
        animate={{ width: navCollapsed ? 60 : 180 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <button 
          onClick={() => setNavCollapsed(!navCollapsed)} 
          className="absolute -right-3 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] border border-white/10 hover:border-[#6C63FF]/50 transition-all text-slate-400 hover:text-white"
        >
          {navCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* LOGO */}
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#7C3AED] shadow-lg shadow-[#6C63FF]/30">
            <Sparkles size={16} className="text-white animate-pulse" />
          </div>
          {!navCollapsed && (
            <span className="font-display font-bold text-sm tracking-wider bg-gradient-to-r from-[#6C63FF] to-[#06B6D4] bg-clip-text text-transparent">SOLARIS</span>
          )}
        </div>

        <div className="w-full h-px bg-white/5 my-2"></div>

        {/* Tab Selection buttons */}
        <div className="flex flex-col gap-2 w-full px-2">
          {[
            { id: "build", label: "Builder", icon: Cpu },
            { id: "workspace", label: "Workspace", icon: FileCode },
            { id: "simulation", label: "Simulator", icon: PlayCircle },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-300 ${
                  active 
                    ? "bg-gradient-to-r from-[#6C63FF]/15 to-[#7C3AED]/5 text-white border border-[#6C63FF]/35 shadow-[inset_0_0_12px_rgba(108,99,255,0.1)]" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon size={18} className={active ? "text-[#6C63FF]" : "text-slate-400"} />
                {!navCollapsed && <span className="text-xs font-semibold">{tab.label}</span>}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Primary Layout Wrapper */}
      <div className="pl-24 pr-4 py-4 min-h-screen flex flex-col gap-6">
        
        {/* Top Navigation Bar */}
        <header className="w-full glass-card rounded-2xl border border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Workflow size={18} className="text-[#6C63FF]" />
              <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">Workspace</span>
            </div>
            {/* Project dropdown selection */}
            <select
              value={activeProjectId || ""}
              onChange={(e) => {
                const found = savedProjects.find(p => p.id === e.target.value);
                if (found) handleLoadProject(found);
              }}
              className="bg-transparent text-sm font-semibold border-none text-white outline-none cursor-pointer focus:ring-0"
            >
              <option value="" disabled className="bg-[#111827]">Select System Arch...</option>
              {savedProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111827] text-white">
                  {p.name}
                </option>
              ))}
            </select>
            <button 
              onClick={handleNewProject}
              className="p-1 rounded bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 hover:bg-[#6C63FF]/20 transition-all active:scale-95"
              title="Create New System"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Search, notification and avatar actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#111827]/40 border border-white/5 px-3 py-1.5 rounded-xl w-60">
              <Search size={14} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Search resources, agents, code..." 
                className="bg-transparent border-none text-xs text-white placeholder-slate-600 outline-none w-full focus:ring-0"
              />
            </div>
            <button className="relative p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 text-slate-300 hover:text-white transition-all">
              <Bell size={16} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_8px_#7C3AED]"></span>
            </button>
            <div className="h-8 w-8 rounded-full border border-white/10 bg-gradient-to-tr from-[#6C63FF] to-[#3B82F6] flex items-center justify-center text-xs font-bold text-white shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Active view layout switch */}
        <AnimatePresence mode="wait">
          {activeTab === "build" && (
            <motion.main 
              key="build"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              
              {/* Main Builder Form Space */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Large Hero Banner */}
                <section className="relative overflow-hidden glass-card rounded-3xl p-8 border border-[#6C63FF]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#7C3AED]/10 blur-3xl"></div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 text-xs font-semibold text-[#6C63FF]">
                      <Sparkles size={12} className="animate-spin" /> v2.4 Engine Active
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      Build Multi-Agent <br />
                      <span className="bg-gradient-to-r from-[#6C63FF] via-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">
                        Systems Visually
                      </span>
                    </h1>
                    <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed">
                      Synthesize autonomous microservices, formulate validation test suites, plan schemas, and deploy container stacks in seconds.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                      <button 
                        onClick={triggerBuild} 
                        disabled={status === "loading"}
                        className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#7C3AED] hover:brightness-110 active:scale-95 transition-all text-xs px-5 py-3 font-semibold text-white flex items-center gap-2 shadow-lg shadow-[#6C63FF]/20 disabled:opacity-50"
                      >
                        Create Architecture <ArrowRight size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (savedProjects.length > 0) handleLoadProject(savedProjects[0]);
                        }}
                        className="rounded-xl bg-[#111827] border border-white/10 hover:border-white/20 text-xs px-5 py-3 font-semibold text-slate-300 hover:text-white transition-all"
                      >
                        Import Project
                      </button>
                    </div>
                  </div>

                  {/* Animated Mini Node flow Graph */}
                  <div className="flex-1 w-full max-w-[280px] p-4 glass-panel rounded-2xl border border-white/5 space-y-2.5 font-mono text-[9px] text-[#94A3B8]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
                      <span className="text-slate-400 font-semibold">Topology Status</span>
                      <span className="inline-flex h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                    </div>
                    {[
                      { node: "User payload", target: "Gateway (Auth)" },
                      { node: "Gateway (Auth)", target: "Agent Planner" },
                      { node: "Agent Planner", target: "Security Auditor" },
                      { node: "Security Auditor", target: "Compiler Output" },
                    ].map((step, sidx) => (
                      <div key={sidx} className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <span className="text-[#6C63FF] font-semibold">{step.node}</span>
                        <ArrowRight size={10} className="text-slate-600" />
                        <span className="text-slate-200">{step.target}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Form: Project Metadata (Section 1) */}
                <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <FileText size={18} className="text-[#6C63FF]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Section 1: Project Parameters</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Project Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Project Name</label>
                      <input 
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Finance Auditing Suite"
                        className="rounded-xl glass-input px-4 py-2.5 text-xs text-white placeholder-slate-600"
                      />
                    </div>
                    {/* Project Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Brief Description</label>
                      <input 
                        type="text"
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        placeholder="e.g. Scans SQL databases and creates alerts"
                        className="rounded-xl glass-input px-4 py-2.5 text-xs text-white placeholder-slate-600"
                      />
                    </div>
                    {/* Industry */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Industry Sector</label>
                      <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="rounded-xl bg-[#111827] border border-white/5 text-xs text-white px-4 py-2.5"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                    {/* Target Users */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Target Users</label>
                      <input 
                        type="text"
                        value={targetUsers}
                        onChange={(e) => setTargetUsers(e.target.value)}
                        className="rounded-xl glass-input px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    {/* LLM Provider */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">LLM Provider</label>
                      <select 
                        value={llmProvider}
                        onChange={(e) => setLlmProvider(e.target.value)}
                        className="rounded-xl bg-[#111827] border border-white/5 text-xs text-white px-4 py-2.5"
                      >
                        <option value="gemini">Gemini-2.0-flash (Recommended)</option>
                        <option value="groq">Groq Llama-3.1</option>
                      </select>
                    </div>
                    {/* Deployment Target */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Deployment Target</label>
                      <select 
                        value={deployment}
                        onChange={(e) => setDeployment(e.target.value)}
                        className="rounded-xl bg-[#111827] border border-white/5 text-xs text-white px-4 py-2.5"
                      >
                        <option value="Fly.io">Fly.io Cloud Microservice</option>
                        <option value="Docker">Self-Hosted Docker Stack</option>
                        <option value="AWS">AWS EC2 Instance</option>
                      </select>
                    </div>
                    {/* Complexity Slider */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>Target Complexity Scale</span>
                        <span className="text-[#6C63FF]">{complexity}/100</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={complexity}
                        onChange={(e) => setComplexity(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#111827] rounded-lg appearance-none cursor-pointer accent-[#6C63FF]"
                      />
                    </div>
                  </div>
                </section>

                {/* Form: Features Cards Selection (Section 2) */}
                <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Layers size={18} className="text-[#7C3AED]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Section 2: Feature Selection Grid</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {FEATURES.map((feat) => {
                      const selected = selectedFeatures.has(feat.id);
                      return (
                        <motion.button
                          type="button"
                          key={feat.id}
                          onClick={() => toggleFeature(feat.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-2xl flex flex-col gap-1.5 items-start text-left transition-all ${
                            selected 
                              ? "glass-card-selected border-[#7C3AED]/40 bg-[#7C3AED]/5" 
                              : "bg-[#111827]/40 border border-white/5 hover:border-[#7C3AED]/20"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`h-2 w-2 rounded-full ${selected ? "bg-[#7C3AED]" : "bg-slate-700"}`} />
                            {selected && <CheckCircle2 size={14} className="text-[#7C3AED]" />}
                          </div>
                          <span className="text-xs font-bold text-white">{feat.label}</span>
                          <span className="text-[10px] text-slate-500 leading-tight line-clamp-2">{feat.desc}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* Form: Architecture Topology Flow Node Graph (Section 3) */}
                <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
                  {result?.workflow ? (
                    <WorkflowSheet 
                      workflow={result.workflow}
                      onWorkflowChange={handleWorkflowChange}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <Workflow size={18} className="text-[#3B82F6]" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Section 3: Architecture Topology</h2>
                      </div>
                      
                      {/* Flow Topology Graphic Placeholder */}
                      <div className="flex flex-wrap items-center justify-center gap-4 bg-[#090b1c]/60 p-6 rounded-2xl border border-white/5">
                        {[
                          { name: "User Entry", color: "from-[#6C63FF]/30 to-[#6C63FF]/10", border: "border-[#6C63FF]/30" },
                          { name: "Gateway Router", color: "from-[#7C3AED]/30 to-[#7C3AED]/10", border: "border-[#7C3AED]/30" },
                          { name: "Agent Planner", color: "from-[#3B82F6]/30 to-[#3B82F6]/10", border: "border-[#3B82F6]/30" },
                          { name: "Scanners Team", color: "from-[#06B6D4]/30 to-[#06B6D4]/10", border: "border-[#06B6D4]/30" },
                          { name: "Models / DB", color: "from-[#10B981]/30 to-[#10B981]/10", border: "border-[#10B981]/30" },
                          { name: "Fly.io API", color: "from-[#ea580c]/30 to-[#ea580c]/10", border: "border-[#ea580c]/30" },
                        ].map((step, idx, arr) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={`px-4 py-2.5 rounded-xl border ${step.border} bg-gradient-to-tr ${step.color} text-xs font-bold text-white shadow-md hover:scale-105 transition-all cursor-default`}>
                              {step.name}
                            </div>
                            {idx < arr.length - 1 && (
                              <ChevronRight size={16} className="text-[#3B82F6] animate-pulse" />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {/* Form: Generated Agents Grid (Section 4) */}
                {result?.architecture?.agents && (
                  <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <Cpu size={18} className="text-[#06B6D4]" />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Section 4: Generated Agent Modules</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.architecture.agents.map((agent, aidx) => (
                        <div key={aidx} className="bg-[#111827]/40 border border-white/5 hover:border-[#6C63FF]/30 p-4 rounded-2xl flex flex-col gap-3 transition-all">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 flex items-center justify-center text-xs font-bold font-mono">
                                A{aidx + 1}
                              </div>
                              <span className="text-xs font-bold text-white">{agent.name || agent.id}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[9px] font-bold font-mono">Ready</span>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed">{agent.role || "Provides domain task auditing."}</p>

                          <div className="flex flex-wrap gap-1">
                            {agent.tools && agent.tools.map((t, tid) => (
                              <span key={tid} className="bg-white/5 border border-white/5 text-[9px] text-slate-300 px-1.5 py-0.5 rounded font-mono">
                                {t}
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1 border-t border-white/5">
                            <span>Tokens: ~4.5k</span>
                            <span>Cost: ~$0.02</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Execution Track & Pipeline Status */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Pipeline Synthesis Stepper Trace */}
                <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#6C63FF]">Compile Flow</span>
                      <h3 className="text-sm font-bold text-white">Pipeline Synthesis Trace</h3>
                    </div>
                    <span className="text-[10px] bg-[#6C63FF]/10 text-[#6C63FF] px-2 py-0.5 rounded border border-[#6C63FF]/20 font-bold font-mono">
                      {doneCount} / 30 Complete
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {pipelineStages.map((stageName, idx) => {
                      const done = idx < doneCount;
                      const active = idx === activeIndex;
                      return (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                            active 
                              ? "bg-[#6C63FF]/10 border-[#6C63FF]/30 text-[#6C63FF]" 
                              : done 
                              ? "bg-[#10B981]/5 border-slate-900 text-slate-300"
                              : "bg-[#111827]/10 border-transparent text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                              active 
                                ? "bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#6C63FF] animate-pulse" 
                                : done 
                                ? "bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981]" 
                                : "bg-slate-950 border border-slate-800 text-slate-600"
                            }`}>
                              {idx + 1}
                            </div>
                            <span className="font-semibold">{stageName}</span>
                          </div>
                          {done && <Check size={12} className="text-[#10B981]" />}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* API Prompt Sandbox Resiliency details */}
                <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7C3AED]">Security Alerts</span>
                    <ShieldAlert size={14} className="text-[#F59E0B]" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Cascading model routing verified: OpenAI Codex / <code className="bg-white/5 px-1 py-0.5 rounded text-sky-400">gpt-4o</code> configured as primary agent router. Automatic failover cascades to Gemini (<code className="bg-white/5 px-1 py-0.5 rounded">gemini-2.0-flash</code>) and rotates to Groq (<code className="bg-white/5 px-1 py-0.5 rounded">llama-3.1-8b-instant</code>) under heavy load.
                  </p>
                </section>
              </div>

            </motion.main>
          )}

          {/* Tab: Workspace / Files view */}
          {activeTab === "workspace" && (
            <motion.main 
              key="workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-12 gap-6 items-stretch h-[calc(100vh-120px)]"
            >
              
              {/* File Tree List */}
              <div className="col-span-3 glass-card rounded-3xl p-4 border border-white/5 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">File Explorer</span>
                  <button 
                    onClick={handleDownloadZip}
                    className="p-1 rounded bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 hover:bg-[#6C63FF]/20 transition-all text-[10px] font-bold flex items-center gap-1"
                  >
                    <Download size={12} /> ZIP
                  </button>
                </div>

                <div className="space-y-1">
                  {filePaths.length === 0 ? (
                    <span className="text-xs text-slate-600 italic">No files generated yet. Run compilation.</span>
                  ) : (
                    filePaths.map((fpath) => {
                      const selected = selectedFileName === fpath;
                      return (
                        <button
                          key={fpath}
                          onClick={() => setSelectedFileName(fpath)}
                          className={`w-full text-left p-2 rounded-xl text-xs font-mono transition-all truncate flex items-center gap-2 ${
                            selected 
                              ? "bg-[#6C63FF]/10 border border-[#6C63FF]/30 text-white" 
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <FileCode size={14} className={selected ? "text-[#6C63FF]" : "text-slate-500"} />
                          {fpath}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Monaco Code Editor */}
              <div className="col-span-9 glass-card rounded-3xl p-4 border border-white/5 flex flex-col gap-4 overflow-hidden relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Code size={16} className="text-[#6C63FF]" />
                    <span className="text-xs font-mono font-bold text-white">{selectedFileName || "Select a file to edit"}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">PEP-8 Auto-Formatter Active</span>
                </div>

                <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-[#030409]">
                  {selectedFileName ? (
                    <MonacoEditor
                      height="100%"
                      language={selectedFileName.endsWith(".py") ? "python" : selectedFileName.endsWith(".html") ? "html" : "json"}
                      theme="vs-dark"
                      value={activeCodeContent}
                      onChange={(val) => handleCodeChange(selectedFileName, val || "")}
                      options={{
                        fontSize: 12,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-600 italic">
                      Choose a source file from the left explorer.
                    </div>
                  )}
                </div>
              </div>

            </motion.main>
          )}

          {/* Tab: Live Simulation Sandbox */}
          {activeTab === "simulation" && (
            <motion.main 
              key="simulation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-12 gap-6 items-stretch h-[calc(100vh-120px)]"
            >
              
              {/* Simulation Configuration Form */}
              <div className="col-span-4 glass-card rounded-3xl p-6 border border-white/5 flex flex-col gap-4 overflow-y-auto">
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#7C3AED]">Execution Subprocess</span>
                  <h3 className="text-sm font-bold text-white">Interactive Sandbox Sandbox</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Mock Payload JSON Input</label>
                  <textarea
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    className="flex-1 min-h-[140px] rounded-xl border border-white/5 bg-slate-950/70 p-3 font-mono text-xs text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10"
                  />
                </div>

                <button
                  onClick={handleSimulateSubmit}
                  disabled={simulating}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:brightness-110 active:scale-98 transition-all py-2.5 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play size={14} /> {simulating ? "Executing run..." : "Trigger Simulation"}
                </button>
              </div>

              {/* Simulation Runner Graph & logs */}
              <div className="col-span-8 glass-card rounded-3xl p-6 border border-white/5 flex flex-col gap-6 overflow-hidden">
                <SimulationCanvas 
                  agents={result?.architecture?.agents || []}
                  activeAgentId={activeSimNode}
                  completedAgents={completedSimNodes}
                  simLogs={simLogs}
                />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-[#1f2937]/50 pt-3">
                    <span className="font-semibold">Terminal Process Logs</span>
                    {simulating && <span className="inline-flex h-2 w-2 rounded-full bg-[#10B981] animate-ping" />}
                  </div>
                  <div className="h-[120px] rounded-xl bg-slate-950/80 border border-white/5 p-3 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-1">
                    {simLogs ? (
                      <pre className="whitespace-pre-wrap word-break">{simLogs}</pre>
                    ) : (
                      <span className="text-slate-600 italic">Awaiting simulation trigger payload.</span>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              </div>

            </motion.main>
          )}

          {/* Tab: Settings */}
          {activeTab === "settings" && (
            <motion.main 
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto w-full"
            >
              <SettingsPanel />
            </motion.main>
          )}
        </AnimatePresence>

        {/* Console / Refine Panel (Bottom Panel) */}
        {result && activeTab === "build" && (
          <section className="w-full glass-card rounded-3xl p-6 border border-white/5 flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-4">
                {[
                  { id: "logs", label: "Build Output Logs", icon: Terminal },
                  { id: "spec", label: "Business Specification", icon: FileText },
                  { id: "preview", label: "Live Client Preview", icon: Globe },
                ].map((cTab) => {
                  const Icon = cTab.icon;
                  const active = consoleTab === cTab.id;
                  return (
                    <button
                      key={cTab.id}
                      onClick={() => setConsoleTab(cTab.id)}
                      className={`flex items-center gap-2 text-xs font-semibold pb-1 border-b-2 transition-all ${
                        active 
                          ? "border-[#6C63FF] text-[#6C63FF]" 
                          : "border-transparent text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Icon size={14} />
                      {cTab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom tab views */}
            <div className={`rounded-2xl bg-slate-950/60 border border-white/5 p-4 text-xs font-mono text-slate-400 ${
              consoleTab === "preview" ? "h-[450px]" : "min-h-[140px] max-h-[220px] overflow-y-auto"
            }`}>
              {consoleTab === "logs" && (
                <pre className="whitespace-pre-wrap leading-relaxed">{output || "No build outputs yet."}</pre>
              )}
              {consoleTab === "spec" && (
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(result.business_spec || {}, null, 2)}
                </pre>
              )}
              {consoleTab === "preview" && (
                <div className="h-full w-full flex flex-col gap-3">
                  {files["static/index.html"] || files["index.html"] ? (
                    <iframe
                      srcDoc={files["static/index.html"] || files["index.html"]}
                      title="Live Client Preview"
                      className="w-full h-full border-0 rounded-2xl bg-white"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <div className="h-full flex flex-col gap-4 items-center justify-center p-6 text-center">
                      <span className="text-slate-400">No static/index.html or index.html found in the generated workspace files.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Code Refinement Prompt (Refine Engine input) */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <input
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder="Request structural changes (e.g. Add a security auditor, swap model to groq)..."
                className="flex-1 rounded-xl glass-input px-4 py-2.5 text-xs text-white"
                onKeyDown={(e) => { if (e.key === "Enter") handleRefineSubmit(); }}
              />
              <button
                onClick={handleRefineSubmit}
                disabled={refining || !refinementInput.trim()}
                className="rounded-xl bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/35 hover:bg-[#6C63FF]/25 px-4 py-2.5 text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw size={14} className={refining ? "animate-spin" : ""} />
                {refining ? "Refining..." : "Refine Codebase"}
              </button>
            </div>
          </section>
        )}

        {/* Floating AI Copilot Assistant (Right Panel) */}
        {result && activeTab === "build" && (
          <div className="fixed right-6 bottom-6 z-40 w-80 glass-card rounded-3xl border border-[#7C3AED]/20 shadow-2xl flex flex-col overflow-hidden max-h-[380px]">
            <div className="bg-gradient-to-r from-[#7C3AED]/15 to-[#3B82F6]/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-[#7C3AED]" />
                <span className="text-xs font-bold text-white">Solaris Copilot</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs max-h-[220px]">
              {copilotMessages.map((msg, midx) => (
                <div key={midx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-[#7C3AED]/15 text-white border border-[#7C3AED]/25 rounded-tr-none" 
                      : "bg-[#111827]/60 text-slate-300 border border-white/5 rounded-tl-none"
                  }`}>
                    {msg.text || <span className="inline-flex gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-white/5 flex items-center gap-2 bg-[#090b1c]/40">
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask architect copilot..."
                className="flex-1 rounded-xl glass-input px-3 py-2 text-xs text-white"
                onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSubmit(); }}
              />
              <button
                onClick={handleCopilotSubmit}
                disabled={copilotLoading || !copilotInput.trim()}
                className="p-2 rounded-xl bg-[#7C3AED] hover:brightness-110 text-white disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Clarification Modal Overlay */}
        {status === "needs_clarification" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="w-full max-w-xl">
              <ClarificationPanel 
                questions={questions} 
                onSubmit={handleClarificationSubmit} 
                isLoading={status === "loading"} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
