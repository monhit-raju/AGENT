import { useEffect, useState } from "react";

export default function ClarificationPanel({ questions, onSubmit, isLoading }) {
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    setAnswers(questions.map(() => ""));
  }, [questions]);

  const allAnswered = answers.every((answer) => answer.trim().length > 0);

  const handleChange = (index, value) => {
    const nextAnswers = [...answers];
    nextAnswers[index] = value;
    setAnswers(nextAnswers);
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-amber-500/20 bg-slate-950/90 p-6 shadow-[0_22px_70px_-30px_rgba(15,23,42,0.8)]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.34em] text-amber-300">Clarification required</p>
        <h2 className="mt-3 text-xl font-semibold text-white">Add missing context</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Answer these questions so the backend can complete the design with the right assumptions.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={`${question}-${index}`} className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
            <p className="text-sm font-medium text-slate-100">{question}</p>
            <input
              type="text"
              value={answers[index] || ""}
              onChange={(event) => handleChange(index, event.target.value)}
              placeholder="Enter your answer"
              className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSubmit(questions.map((question, index) => ({ question, answer: answers[index] })))}
        disabled={!allAnswered || isLoading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Submitting answers…" : "Continue generation"}
      </button>
    </section>
  );
}
