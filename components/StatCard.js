const toneClasses = {
  positive: "text-emerald-600",
  negative: "text-rose-600",
  neutral: "text-slate-900",
};

export default function StatCard({ label, value, tone = "neutral" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${toneClasses[tone] || toneClasses.neutral}`}>
        {value}
      </p>
    </div>
  );
}
