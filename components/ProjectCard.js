import Link from "next/link";
import { formatCurrency } from "@/lib/format";

export default function ProjectCard({ project }) {
  return (
    <Link
      href={`/project/${encodeURIComponent(project.name)}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-300"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 leading-snug">{project.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            project.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {project.active ? "Active" : "Closed"}
        </span>
      </div>
      {project.employee && (
        <p className="mt-1 text-xs text-slate-500">Handled by {project.employee}</p>
      )}
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">Total</dt>
          <dd className="font-medium text-slate-700">{formatCurrency(project.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Paid</dt>
          <dd className="font-medium text-emerald-600">{formatCurrency(project.totalPayment)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Balance</dt>
          <dd className={`font-medium ${project.balance > 0 ? "text-rose-600" : "text-slate-700"}`}>
            {formatCurrency(project.balance)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
