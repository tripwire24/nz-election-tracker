export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-stone-200 dark:bg-stone-700" />
      <div className="h-4 w-72 rounded bg-stone-100 dark:bg-stone-800" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800" />
    </div>
  );
}
