/** Reusable card wrapper for dashboard widgets */
export function DashboardCard({
  title,
  badge,
  children,
  className = "",
  accent,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border border-zinc-800/60 bg-zinc-900/80 p-5 shadow-lg shadow-black/20 animate-fade-in ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-700/50">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
