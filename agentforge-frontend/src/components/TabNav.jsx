export default function TabNav({ tabs, active, onChange }) {
  return (
    <nav className="flex items-center gap-3">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-full px-4 py-2 text-sm font-medium ${active === t ? 'bg-sky-500 text-slate-950' : 'bg-transparent text-slate-300 hover:bg-slate-800/60'}`}
        >
          {t}
        </button>
      ))}
    </nav>
  );
}
