"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function CopyPortalLinkButton({ url }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (older browsers, insecure context). Fall
      // back to showing the link so the user can copy it manually.
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copy a private link this contractor can use to view their own invoices and payments"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Copy Portal Link"}
    </button>
  );
}
