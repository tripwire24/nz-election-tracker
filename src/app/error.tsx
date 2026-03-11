"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 text-4xl mb-6">
        ⚠️
      </div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
      >
        Try again
      </button>
    </div>
  );
}
