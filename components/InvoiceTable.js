import { formatCurrency, formatDate } from "@/lib/format";
import EmptyState from "./EmptyState";

const statusStyles = {
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-amber-100 text-amber-700",
  Unpaid: "bg-rose-100 text-rose-700",
};

export default function InvoiceTable({ invoices }) {
  if (!invoices || invoices.length === 0) {
    return <EmptyState message="No invoices found for this project." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Invoice #</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">Amount</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">Paid</th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">Balance</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv, idx) => (
            <tr key={`${inv.invoiceNumber}-${idx}`} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                {inv.invoiceNumber || "-"}
              </td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
              <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                {formatCurrency(inv.amount)}
              </td>
              <td className="px-4 py-3 text-right text-emerald-600 whitespace-nowrap">
                {formatCurrency(inv.paidAmount)}
              </td>
              <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                {formatCurrency(inv.balanceAmount)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyles[inv.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {inv.status || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
