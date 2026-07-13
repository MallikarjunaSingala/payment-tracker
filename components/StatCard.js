const toneClasses = {
  positive: "text-emerald-600",
  negative: "text-rose-600",
  neutral: "text-slate-900",
};

const iconToneClasses = {
  positive: "bg-emerald-50 text-emerald-600",
  negative: "bg-rose-50 text-rose-600",
  neutral: "bg-indigo-50 text-indigo-600",
};

export default function StatCard({ label, value, tone = "neutral", icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className={`mt-1 text-lg font-semibold ${toneClasses[tone] || toneClasses.neutral}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconToneClasses[tone] || iconToneClasses.neutral}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
    </div>
  );
}
