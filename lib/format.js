export function formatCurrency(value) {
  const num = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPhone(phone) {
  if (!phone) return "-";
  const trimmed = String(phone).trim();
  if (!trimmed || trimmed === "0") return "-";
  return trimmed;
}

// Standard PDF fonts (Helvetica etc.) don't include the ₹ glyph, so PDFs use
// "Rs." instead of the rupee symbol to avoid rendering a missing-glyph box.
export function formatCurrencyForPdf(value) {
  const num = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs);
  return `${num < 0 ? "-" : ""}Rs. ${formatted}`;
}
