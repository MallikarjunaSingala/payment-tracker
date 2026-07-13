import Link from "next/link";

export default function Header({ title, subtitle, backHref, backLabel }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-5">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <span aria-hidden="true">&larr;</span> {backLabel || "Back"}
          </Link>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 break-words">{subtitle}</p>}
      </div>
    </header>
  );
}
