const STAGES = [
  { id: "business_understanding", label: "Business Understanding", desc: "Extract spec & confidence" },
  { id: "agent_planner", label: "Agent Planner", desc: "Plan multi-agent roles" },
  { id: "workflow_designer", label: "Workflow Designer", desc: "Design connection edges" },
  { id: "workflow_validator", label: "Validation Check", desc: "Verify agent integrity" },
  { id: "prompt_generator", label: "Prompt Generator", desc: "Formulate system prompts" },
  { id: "tool_selector", label: "Tool Selector", desc: "Match developer tools" },
  { id: "code_generator", label: "Code Generator", desc: "Draft codebase files" },
  { id: "ui_generator", label: "UI Designer", desc: "Create end-user web dashboard" },
  { id: "db_architect", label: "Database Architect", desc: "Plan database models & migrations" },
  { id: "test_generator", label: "Test Suite Generator", desc: "Build backend validation tests" },
  { id: "doc_generator", label: "API Documentation", desc: "Create developer markdown guides" },
  { id: "security_analyzer", label: "Security Scanner", desc: "Audit source files for vulnerabilities" },
  { id: "lint_healer", label: "Code Style Healer", desc: "Format and syntax clean python files" },
  { id: "architecture_diagrammer", label: "Architecture Diagrammer", desc: "Generate Mermaid systems diagrams" },
];

export default function PipelineTrace({ activeIndex, doneCount }) {
  return (
    <section className="glass-panel overflow-hidden rounded-3xl p-6 shadow-xl">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">Execution Flow</span>
          <h2 className="font-display text-lg font-bold text-white">Pipeline Synthesis Trace</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300">
          <span className="font-semibold text-sky-400">{doneCount}</span>
          <span className="text-slate-600">/</span>
          <span>{STAGES.length} Complete</span>
        </div>
      </div>

      <div className="relative">
        {/* Connection line overlay */}
        <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-slate-800" />
        
        <div className="space-y-4 relative z-10">
          {STAGES.map((stage, index) => {
            const isDone = index < doneCount;
            const isActive = index === activeIndex;
            const isPending = !isDone && !isActive;

            return (
              <div
                key={stage.id}
                className={`flex items-start gap-4 rounded-2xl p-3 transition-all duration-300 ${
                  isActive
                    ? "bg-sky-950/35 border border-sky-500/30 shadow-[0_0_15px_-5px_rgba(0,245,255,0.2)]"
                    : isDone
                    ? "bg-slate-900/20 border border-slate-900/55"
                    : "border border-transparent"
                }`}
              >
                {/* Stepper Node */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300">
                  {isDone ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg stepper-node-done text-emerald-400">
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg stepper-node-active text-sky-400 animate-pulse">
                      <svg className="h-4.5 w-4.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-slate-600 font-mono text-xs">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 space-y-0.5 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-semibold transition-colors duration-200 ${isActive ? "text-sky-300" : isDone ? "text-slate-200" : "text-slate-500"}`}>
                      {stage.label}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isDone
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : isActive
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-slate-950 text-slate-600 border border-slate-900"
                      }`}
                    >
                      {isDone ? "Done" : isActive ? "Active" : "Pending"}
                    </span>
                  </div>
                  <p className={`text-xs transition-colors duration-200 ${isActive ? "text-slate-300" : isDone ? "text-slate-400" : "text-slate-600"}`}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
