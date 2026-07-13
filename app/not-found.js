import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-semibold text-slate-900">Not found</h2>
      <p className="mt-2 text-sm text-slate-500">We couldn&apos;t find what you were looking for.</p>
      <Link href="/" className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800">
        &larr; Back to dashboard
      </Link>
    </div>
  );
}
