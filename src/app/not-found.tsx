import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 text-4xl mb-6">
        🗳️
      </div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Page not found</h1>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
