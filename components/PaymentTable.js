import { formatCurrency, formatDate } from "@/lib/format";
import EmptyState from "./EmptyState";

export default function PaymentTable({ payments }) {
  if (!payments || payments.length === 0) {
    return <EmptyState message="No payments recorded for this project." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Receipt #</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">Balance After</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((p, idx) => (
            <tr key={`${p.receiptNo}-${idx}`} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(p.date)}</td>
              <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                {p.receiptNo || "-"}
              </td>
              <td className="px-4 py-3 text-right text-emerald-600 whitespace-nowrap">
                {formatCurrency(p.amount)}
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.paymentType || "-"}</td>
              <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                {formatCurrency(p.balance)}
              </td>
              <td className="px-4 py-3 text-slate-500">{p.remarks || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
