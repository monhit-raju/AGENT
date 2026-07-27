export default function OutputPanel({ output, onClear }) {
  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">API Output</p>
        <div className="flex gap-2">
          <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-200">Clear</button>
        </div>
      </div>
      <div className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-900/80 p-3 text-sm text-slate-100">
        {typeof output === "string" ? (
          <pre className="whitespace-pre-wrap">{output}</pre>
        ) : (
          <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
