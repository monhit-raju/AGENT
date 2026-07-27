import Sheet from "./Sheet.jsx";

export default function BusinessSheet({ businessSpec, compact }) {
  const tasks = businessSpec?.key_tasks || [];
  const constraints = businessSpec?.constraints || [];
  const assumptions = businessSpec?.assumptions || [];

  return (
    <Sheet
      number={compact ? undefined : "01"}
      title="Business Requirement"
      subtitle={businessSpec?.domain ? businessSpec.domain : "No requirement yet"}
    >
      {businessSpec ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="space-y-6 rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Primary goal</p>
                <p className="mt-4 text-lg leading-8 text-slate-100">{businessSpec.goal}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/90 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Confidence</p>
                  <p className="mt-3 text-sm font-semibold text-white">{businessSpec.confidence}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/90 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Domain</p>
                  <p className="mt-3 text-sm font-semibold text-white">{businessSpec.domain || "General"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Key tasks</p>
              <div className="grid gap-3">
                {tasks.map((task) => (
                  <span key={task} className="rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-slate-200">
                    {task}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Constraints</p>
              {constraints.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  {constraints.map((item) => (
                    <li key={item} className="rounded-3xl bg-slate-900/90 p-4">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No constraints detected.</p>
              )}
            </div>
            <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Assumptions</p>
              {assumptions.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  {assumptions.map((item) => (
                    <li key={item} className="rounded-3xl bg-slate-900/90 p-4">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No assumptions were needed.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Submit your request to see the extracted business requirements.</p>
      )}
    </Sheet>
  );
}
