import Link from "next/link";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/auth";

export default function Header({ title, subtitle, backHref, backLabel, actions }) {
  const cookieStore = cookies();
  const user = cookieStore.get(USER_COOKIE_NAME)?.value;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            PT
          </span>
          <span className="text-sm font-semibold text-slate-700">Payment Tracker</span>
        </Link>

        {user && (
          <form action="/api/auth/logout" method="POST" className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Signed in as <span className="font-medium text-slate-700">{user}</span>
            </span>
            <button
              type="submit"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <span aria-hidden="true">&larr;</span> {backLabel || "Back"}
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500 break-words">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
