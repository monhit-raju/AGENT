import { useEffect, useState } from "react";
import Sheet from "./Sheet.jsx";
import { downloadProjectUrl } from "../api.js";

export default function CodeSheet({ generatedCode, validationReport, userInput }) {
  const files = generatedCode || {};
  const fileNames = Object.keys(files);
  const [selected, setSelected] = useState(fileNames[0] || null);

  useEffect(() => {
    if (!selected && fileNames.length > 0) {
      setSelected(fileNames[0]);
    }
  }, [fileNames, selected]);

  const isValid = validationReport?.is_valid;

  return (
    <Sheet number="06" title="Generated Code" subtitle={`${fileNames.length} files`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isValid ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20"}`}>
            {isValid ? "Validation passed" : "Validation warnings"}
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
            {fileNames.length} files
          </span>
        </div>
        <a href={downloadProjectUrl(userInput)} className="inline-flex items-center justify-center rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
          Download project zip
        </a>
      </div>

      {fileNames.length ? (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-4 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.8)]">
            {fileNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(name)}
                className={`block w-full truncate rounded-2xl px-4 py-3 text-left text-sm transition ${selected === name ? "bg-sky-500/10 text-sky-300" : "text-slate-300 hover:bg-slate-900"}`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.8)]">
            <div className="border-b border-slate-800/70 bg-slate-900/90 px-5 py-4">
              <p className="text-sm font-semibold text-white">Preview</p>
              <p className="mt-1 text-xs text-slate-500">{selected || "Select a file to inspect"}</p>
            </div>
            <pre className="min-h-[400px] overflow-auto p-5 text-sm leading-6 text-slate-200">
              {selected ? files[selected] : "Select a file to preview"}
            </pre>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6 text-sm text-slate-400 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.8)]">
          Generated code will appear here once the pipeline completes.
        </div>
      )}
    </Sheet>
  );
}
