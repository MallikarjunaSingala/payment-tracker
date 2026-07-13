import Link from "next/link";
import { formatCurrency, formatPhone } from "@/lib/format";

export default function ContractorCard({ contractor }) {
  const balancePositive = contractor.totalBalance > 0;
  return (
    <Link
      href={`/contractor/${encodeURIComponent(contractor.name)}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-300"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 leading-snug">{contractor.name}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {contractor.projectCount} project{contractor.projectCount !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{formatPhone(contractor.phone)}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">Total</dt>
          <dd className="font-medium text-slate-700">{formatCurrency(contractor.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Paid</dt>
          <dd className="font-medium text-emerald-600">{formatCurrency(contractor.totalPayment)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Balance</dt>
          <dd className={`font-medium ${balancePositive ? "text-rose-600" : "text-slate-700"}`}>
            {formatCurrency(contractor.totalBalance)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
