export default function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <h3 className="font-semibold text-rose-800">Couldn&apos;t load data</h3>
      <p className="mt-1 text-sm text-rose-600 break-words">{message}</p>
      <p className="mt-3 text-xs text-rose-500">
        Check your Google Sheets credentials and sharing settings (see README.md), then refresh this page.
      </p>
    </div>
  );
}
